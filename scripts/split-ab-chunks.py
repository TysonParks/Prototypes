#!/usr/bin/env python3
"""
Split Art Blocks submission bundle into on-chain script segments.

Art Blocks stores project scripts in ~24 KB segments. Creator Dashboard
"Script Compression" compresses each segment independently before
addProjectScriptCompressed(); on read, each index is decompressed then
concatenated. Manual upload should paste plaintext chunks and leave
compression ON — do not gzip the whole file and slice compressed bytes.

Default limit 23552 matches the Sepolia Creator Dashboard auto-chunker
review UI (2026-07-09).

Usage:
  ./scripts/split-ab-chunks.py
  ./scripts/split-ab-chunks.py --src dist/submission/prototypes.js
  ./build.sh --strip --chunks

See docs/Operational/SUBMISSION-MANIFEST.md § Art Blocks script chunks.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import sys
from datetime import datetime, timezone
from pathlib import Path

# Creator Dashboard auto-chunker review pane (Sepolia, 2026-07-09).
DEFAULT_LIMIT = 23552

# Reference from first Sepolia deploy attempt (strip build, Script Compression ON).
# Auto UI reported 17 chunks at 23552 each while a naive plaintext split of the
# then-current ~499626-byte strip bundle would be 22 chunks. Keep both for
# estimation when the auto pipeline is unavailable.
SEPOLIA_REF = {
    "date": "2026-07-09",
    "bundle_bytes_approx": 499626,
    "auto_ui_chunks": 17,
    "auto_ui_chunk_bytes": 23552,
    "auto_ui_implied_payload_bytes": 17 * 23552,  # 400384
    "naive_plaintext_chunks_at_23552": 22,
    "local_whole_file_gzip9_bytes": 107578,
    "notes": (
        "Compression is per-segment, not whole-file-then-slice. "
        "17 vs 22 discrepancy unresolved (dashboard packing vs source delta). "
        "Estimate txs ≈ ceil(bundle_bytes / 23552); optional ~0.77× factor "
        "from this event only if auto UI is available again."
    ),
}


def split_bytes(data: bytes, limit: int) -> list[bytes]:
    if limit < 1:
        raise ValueError("limit must be >= 1")
    return [data[i : i + limit] for i in range(0, len(data), limit)]


def gzip_size(blob: bytes) -> int:
    return len(gzip.compress(blob, compresslevel=9))


def write_chunks(
    src: Path,
    out_dir: Path,
    limit: int,
) -> dict:
    data = src.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    chunks = split_bytes(data, limit)

    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("chunk-*.js"):
        old.unlink()
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

    manifest_lines = [
        "BoredUI Art Blocks script chunks",
        f"Built: {built}",
        f"Source: {src}",
        f"Source bytes: {len(data)}",
        f"SHA-256: {digest}",
        f"Chunk limit (plaintext): {limit}",
        f"Chunk count: {len(chunks)}",
        f"Whole-file gzip-9 estimate: {whole_gz} bytes "
        f"({100.0 * whole_gz / len(data):.1f}% of plaintext)",
        "",
        "Upload order (Creator Dashboard manual workspace):",
        "  1. UPDATE existing script index 0 with chunk-01 (UI may forbid delete).",
        "  2. ADD chunk-02 … chunk-N in order; leave Script Compression ON.",
        "  3. On failed tx, retry the SAME chunk file — do not re-split mid-upload.",
        "  4. Preview after all indices land; do not lock until render works.",
        "",
        "Per-chunk:",
    ]
    for r in rows:
        manifest_lines.append(
            f"  {r['name']}: {r['bytes']} plaintext / "
            f"{r['gzip9_bytes']} gzip-9 estimate"
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
        "whole_gzip9": whole_gz,
        "out_dir": out_dir,
        "manifest": manifest_path,
        "rows": rows,
    }


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Split submission bundle into Art Blocks ≤24KB plaintext chunks."
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
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Max plaintext bytes per chunk (default: {DEFAULT_LIMIT})",
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

    try:
        info = write_chunks(src, out_dir, args.limit)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(
        f"Wrote {info['chunk_count']} chunks → {info['out_dir']} "
        f"({info['bytes']} bytes, limit {info['limit']})"
    )
    print(f"SHA-256: {info['sha256']}")
    print(
        f"gzip-9 whole-file estimate: {info['whole_gzip9']} bytes "
        f"({100.0 * info['whole_gzip9'] / info['bytes']:.1f}%)"
    )
    print(f"Manifest: {info['manifest']}")
    print(
        "Upload: UPDATE index 0 with chunk-01, then ADD chunk-02… "
        "(Script Compression ON)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
