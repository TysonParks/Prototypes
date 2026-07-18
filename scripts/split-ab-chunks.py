#!/usr/bin/env python3
"""
Split Art Blocks submission bundle into on-chain script segments.

Art Blocks stores project scripts in ~24 KB on-chain segments. Creator Dashboard
"Script Compression" compresses each segment independently before
addProjectScriptCompressed(); on read, each index is decompressed then
concatenated. Manual upload should paste plaintext chunks and leave
compression ON — do not gzip the whole file and slice compressed bytes.

Default: target **18** chunks (one above the Sepolia auto-chunker's 17) so
plaintext may exceed 23552 B when compression keeps stored size under budget.
Fall back with --limit 23552 if the dashboard rejects a paste.

Usage:
  ./scripts/split-ab-chunks.py
  ./scripts/split-ab-chunks.py --count 18
  ./scripts/split-ab-chunks.py --limit 23552
  ./build.sh --strip --chunks

See docs/Operational/SUBMISSION-MANIFEST.md § Art Blocks script chunks.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

# Conservative plaintext ceiling from Creator Dashboard copy / auto-chunker UI.
SAFE_PLAINTEXT_LIMIT = 23552

# Default target count: Sepolia auto UI used 17; keep +1 headroom for manual path.
DEFAULT_TARGET_COUNT = 18

# Reference from first Sepolia deploy attempt (strip build, Script Compression ON).
SEPOLIA_REF = {
    "date": "2026-07-09",
    "bundle_bytes_approx": 499626,
    "auto_ui_chunks": 17,
    "auto_ui_chunk_bytes": 23552,
    "auto_ui_implied_payload_bytes": 17 * 23552,  # 400384
    "naive_plaintext_chunks_at_23552": 22,
    "local_whole_file_gzip9_bytes": 107578,
    "manual_target_chunks": DEFAULT_TARGET_COUNT,
    "notes": (
        "Compression is per-segment, not whole-file-then-slice. "
        "Auto UI showed 17 chunks; naive @23552 was 22 (~0.77×). "
        "Manual default targets 18 chunks (limit = ceil(bytes/18)). "
        "If dashboard rejects paste size, use --limit 23552."
    ),
}


def split_bytes(data: bytes, limit: int) -> list[bytes]:
    if limit < 1:
        raise ValueError("limit must be >= 1")
    return [data[i : i + limit] for i in range(0, len(data), limit)]


def gzip_size(blob: bytes) -> int:
    return len(gzip.compress(blob, compresslevel=9))


def limit_for_count(byte_len: int, count: int) -> int:
    if count < 1:
        raise ValueError("count must be >= 1")
    return max(1, math.ceil(byte_len / count))


def write_chunks(
    src: Path,
    out_dir: Path,
    limit: int,
    *,
    target_count: int | None = None,
) -> dict:
    data = src.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    chunks = split_bytes(data, limit)

    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("chunk-*.js"):
        old.unlink()
    # Keep HOTFIX-*.txt notes; only refresh MANIFEST.txt
    for old in out_dir.glob("MANIFEST.*"):
        old.unlink()

    rows = []
    for i, chunk in enumerate(chunks, 1):
        name = f"chunk-{i:02d}-of-{len(chunks):02d}.js"
        path = out_dir / name
        path.write_bytes(chunk)
        gz = gzip_size(chunk)
        rows.append(
            {
                "index": i,
                "name": name,
                "bytes": len(chunk),
                "gzip9_bytes": gz,
            }
        )

    joined = b"".join((out_dir / r["name"]).read_bytes() for r in rows)
    if joined != data:
        raise RuntimeError("round-trip concat failed — aborting")

    whole_gz = gzip_size(data)
    built = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    max_gz = max(r["gzip9_bytes"] for r in rows)
    over_safe = limit > SAFE_PLAINTEXT_LIMIT

    manifest_lines = [
        "BoredUI Art Blocks script chunks",
        f"Built: {built}",
        f"Source: {src}",
        f"Source bytes: {len(data)}",
        f"SHA-256: {digest}",
        f"Chunk limit (plaintext): {limit}",
        f"Chunk count: {len(chunks)}"
        + (f" (target {target_count})" if target_count else ""),
        f"Whole-file gzip-9 estimate: {whole_gz} bytes "
        f"({100.0 * whole_gz / len(data):.1f}% of plaintext)",
        f"Max per-chunk gzip-9 estimate: {max_gz} bytes",
        "",
    ]
    if over_safe:
        manifest_lines.extend(
            [
                f"NOTE: plaintext limit {limit} > safe UI ceiling {SAFE_PLAINTEXT_LIMIT}.",
                "  Relies on Script Compression keeping on-chain size under ~24KB.",
                "  If paste/upload rejects, re-split: python3 scripts/split-ab-chunks.py --limit 23552",
                "",
            ]
        )

    manifest_lines.extend(
        [
            "Upload order (Creator Dashboard manual workspace):",
            "  1. UPDATE existing script index 0 with chunk-01 (UI may forbid delete).",
            "  2. ADD chunk-02 … chunk-N in order; leave Script Compression ON.",
            "  3. On failed tx, retry the SAME chunk file — do not re-split mid-upload.",
            "  4. Preview after all indices land; do not lock until render works.",
            "  5. Replacing a prior N-segment deploy: remove trailing segments or",
            "     replace the whole set so scriptCount matches this chunk count.",
            "",
            "Per-chunk:",
        ]
    )
    for r in rows:
        flag = "  ** gzip-9 >= 23552 **" if r["gzip9_bytes"] >= SAFE_PLAINTEXT_LIMIT else ""
        manifest_lines.append(
            f"  {r['name']}: {r['bytes']} plaintext / "
            f"{r['gzip9_bytes']} gzip-9 estimate{flag}"
        )

    manifest_lines.extend(
        [
            "",
            "Sepolia reference (2026-07-09, Script Compression ON):",
            f"  auto UI chunks: {SEPOLIA_REF['auto_ui_chunks']} × "
            f"{SEPOLIA_REF['auto_ui_chunk_bytes']} "
            f"(implied payload {SEPOLIA_REF['auto_ui_implied_payload_bytes']})",
            f"  naive plaintext @23552 for ~{SEPOLIA_REF['bundle_bytes_approx']} B: "
            f"{SEPOLIA_REF['naive_plaintext_chunks_at_23552']}",
            f"  local whole-file gzip-9 of that strip build: "
            f"{SEPOLIA_REF['local_whole_file_gzip9_bytes']} B",
            f"  manual default target: {SEPOLIA_REF['manual_target_chunks']} chunks",
            f"  note: {SEPOLIA_REF['notes']}",
            "",
            "Model: plaintext split → dashboard compresses each segment → "
            "on-chain decompress per index → concat.",
        ]
    )

    manifest_path = out_dir / "MANIFEST.txt"
    manifest_path.write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")

    return {
        "bytes": len(data),
        "sha256": digest,
        "chunk_count": len(chunks),
        "limit": limit,
        "target_count": target_count,
        "whole_gzip9": whole_gz,
        "max_chunk_gzip9": max_gz,
        "over_safe_plaintext": over_safe,
        "out_dir": out_dir,
        "manifest": manifest_path,
        "rows": rows,
    }


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description=(
            "Split submission bundle into Art Blocks script chunks. "
            f"Default: --count {DEFAULT_TARGET_COUNT} (Sepolia auto was 17)."
        )
    )
    parser.add_argument(
        "--src",
        type=Path,
        default=root / "dist" / "submission" / "prototypes.js",
        help="Bundle to split (default: dist/submission/prototypes.js)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: <src-dir>/chunks)",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        help=(
            f"Target chunk count (default: {DEFAULT_TARGET_COUNT}). "
            "Sets plaintext limit to ceil(bytes/count)."
        ),
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help=(
            f"Max plaintext bytes per chunk. Overrides --count. "
            f"Use {SAFE_PLAINTEXT_LIMIT} for conservative dashboard-safe splits."
        ),
    )
    args = parser.parse_args()

    src = args.src if args.src.is_absolute() else (Path.cwd() / args.src).resolve()
    if not src.is_file():
        print(f"Missing source: {src}", file=sys.stderr)
        print("Run ./build.sh --strip first (or pass --src).", file=sys.stderr)
        return 1

    out_dir = args.out
    if out_dir is None:
        out_dir = src.parent / "chunks"
    elif not out_dir.is_absolute():
        out_dir = (Path.cwd() / out_dir).resolve()

    data_len = src.stat().st_size
    target_count = None
    if args.limit is not None:
        limit = args.limit
    else:
        target_count = args.count if args.count is not None else DEFAULT_TARGET_COUNT
        limit = limit_for_count(data_len, target_count)

    try:
        info = write_chunks(src, out_dir, limit, target_count=target_count)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(
        f"Wrote {info['chunk_count']} chunks → {info['out_dir']} "
        f"({info['bytes']} bytes, limit {info['limit']})"
    )
    if info["over_safe_plaintext"]:
        print(
            f"NOTE: plaintext limit {info['limit']} > {SAFE_PLAINTEXT_LIMIT} "
            "(compression-dependent; fall back with --limit 23552 if upload rejects).",
            file=sys.stderr,
        )
    if info["max_chunk_gzip9"] >= SAFE_PLAINTEXT_LIMIT:
        print(
            f"WARNING: max gzip-9 estimate {info['max_chunk_gzip9']} >= "
            f"{SAFE_PLAINTEXT_LIMIT} — on-chain store may fail; use more chunks.",
            file=sys.stderr,
        )
    print(f"SHA-256: {info['sha256']}")
    print(
        f"gzip-9 whole-file estimate: {info['whole_gzip9']} bytes "
        f"({100.0 * info['whole_gzip9'] / info['bytes']:.1f}%); "
        f"max chunk gzip-9: {info['max_chunk_gzip9']}"
    )
    print(f"Manifest: {info['manifest']}")
    print(
        "Upload: UPDATE index 0 with chunk-01, then ADD chunk-02… "
        "(Script Compression ON). Prior 22-segment deploy needs trailing "
        "segments removed or a full replace so scriptCount matches."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
