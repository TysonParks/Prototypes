#!/usr/bin/env bash
# E2 submission bundle — concatenate production JS for Art Blocks upload.
# See docs/Operational/SUBMISSION-MANIFEST.md and docs/Operational/ARTBLOCKS-SPRINT.md (E2–E4).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="${ROOT}/build/manifest.txt"
OUT_DIR="${ROOT}/dist"
SUB_DIR="${OUT_DIR}/submission"
PREVIEW_DIR="${OUT_DIR}/preview"
BUNDLE_NAME="prototypes.js"
P5_VERSION="1.11.11"

MINIFY=0
WITH_P5=0
WITH_MARKERS=0
PREVIEW=1
VERIFY_ONLY=0

usage() {
  cat <<'EOF'
Usage: ./build.sh [options]

Build the Art Blocks submission JavaScript bundle from build/manifest.txt
(SUBMISSION-MANIFEST load order). Excludes testing/, guiDev.js, archive/, etc.

Options:
  --minify       Strip comments/whitespace (terser if installed, else safe fallback)
  --with-p5      Prepend libraries/p5.min.js (standalone bundle; AB injects p5 for upload)
  --markers      Insert // === file:path === boundaries between sources (debug builds)
  --no-preview   Skip dist/preview/index.html + style.css copy
  --verify       Check manifest paths exist, then exit
  --out-dir DIR  Output root (default: dist/)
  -h, --help     Show this help

Outputs (default):
  dist/submission/prototypes.js   ← upload to Art Blocks test bench
  dist/submission/BUILD-REPORT.txt
  dist/preview/index.html         ← local E4 parity smoke test
  dist/preview/prototypes.js
  dist/preview/style.css
  dist/preview/libraries/p5.min.js  (symlink or copy when present)

Art Blocks (Q1/Q6): upload dist/submission/prototypes.js only — platform injects p5.
Local preview: open dist/preview/index.html via a static server (file:// may block modules).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --minify) MINIFY=1 ;;
    --with-p5) WITH_P5=1 ;;
    --markers) WITH_MARKERS=1 ;;
    --no-preview) PREVIEW=0 ;;
    --verify) VERIFY_ONLY=1 ;;
    --out-dir)
      shift
      OUT_DIR="$1"
      SUB_DIR="${OUT_DIR}/submission"
      PREVIEW_DIR="${OUT_DIR}/preview"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

# Read manifest (skip blanks and # comments)
SOURCES=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" ]] && continue
  SOURCES+=("$line")
done < "$MANIFEST"

if [[ ${#SOURCES[@]} -eq 0 ]]; then
  echo "No sources listed in $MANIFEST" >&2
  exit 1
fi

# Verify all sources exist
missing=0
for rel in "${SOURCES[@]}"; do
  if [[ ! -f "${ROOT}/${rel}" ]]; then
    echo "Missing source: ${rel}" >&2
    missing=1
  fi
done
if [[ $WITH_P5 -eq 1 && ! -f "${ROOT}/libraries/p5.min.js" ]]; then
  echo "Missing libraries/p5.min.js (--with-p5)" >&2
  missing=1
fi
if [[ $missing -eq 1 ]]; then
  exit 1
fi

if [[ $VERIFY_ONLY -eq 1 ]]; then
  echo "OK: ${#SOURCES[@]} manifest sources found."
  exit 0
fi

mkdir -p "$SUB_DIR" "$PREVIEW_DIR"

build_bundle() {
  local dest="$1"
  local tmp
  tmp="$(mktemp)"
  : > "$tmp"

  if [[ $WITH_P5 -eq 1 ]]; then
    if [[ $WITH_MARKERS -eq 1 ]]; then
      printf '\n// === file:libraries/p5.min.js ===\n' >> "$tmp"
    fi
    cat "${ROOT}/libraries/p5.min.js" >> "$tmp"
  fi

  for rel in "${SOURCES[@]}"; do
    if [[ $WITH_MARKERS -eq 1 ]]; then
      printf '\n// === file:%s ===\n' "$rel" >> "$tmp"
    fi
    cat "${ROOT}/${rel}" >> "$tmp"
    printf '\n' >> "$tmp"
  done

  if [[ $MINIFY -eq 1 ]]; then
    minify_file "$tmp" "$dest"
    rm -f "$tmp"
  else
    mv "$tmp" "$dest"
  fi
}

minify_file() {
  local src="$1"
  local dest="$2"
  if command -v terser >/dev/null 2>&1; then
    terser "$src" --compress false --mangle false --comments false -o "$dest"
    return
  fi
  if command -v npx >/dev/null 2>&1; then
    npx --yes terser "$src" --compress false --mangle false --comments false -o "$dest"
    return
  fi
  # Safe fallback: drop full-line // comments and excess blank lines (E3 light pass)
  python3 - "$src" "$dest" <<'PY'
import re, sys
src, dest = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
out = []
for line in text.splitlines():
    if re.match(r'^\s*//', line):
        continue
    out.append(line.rstrip())
body = "\n".join(out)
body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
open(dest, "w", encoding="utf-8").write(body)
PY
}

write_report() {
  local bundle="$1"
  local report="$2"
  {
    echo "BoredUI submission build"
    echo "Built: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Bundle: $(basename "$bundle")"
    echo "Minify: $([[ $MINIFY -eq 1 ]] && echo yes || echo no)"
    echo "With p5: $([[ $WITH_P5 -eq 1 ]] && echo yes || echo no)"
    echo ""
    echo "Per-file contributions (raw bytes):"
    total=0
    if [[ $WITH_P5 -eq 1 ]]; then
      sz=$(wc -c < "${ROOT}/libraries/p5.min.js" | tr -d ' ')
      printf '  %8d  libraries/p5.min.js\n' "$sz"
      total=$((total + sz))
    fi
    for rel in "${SOURCES[@]}"; do
      sz=$(wc -c < "${ROOT}/${rel}" | tr -d ' ')
      printf '  %8d  %s\n' "$sz" "$rel"
      total=$((total + sz))
    done
    echo "  --------"
    printf '  %8d  raw total\n' "$total"
    bsz=$(wc -c < "$bundle" | tr -d ' ')
    printf '  %8d  bundle output\n' "$bsz"
    echo ""
    echo "Upload: dist/submission/prototypes.js (p5 injected by Art Blocks)"
    echo "Local test: dist/preview/index.html"
  } > "$report"
}

SUB_BUNDLE="${SUB_DIR}/${BUNDLE_NAME}"
build_bundle "$SUB_BUNDLE"
write_report "$SUB_BUNDLE" "${SUB_DIR}/BUILD-REPORT.txt"

echo "Wrote ${SUB_BUNDLE} ($(wc -c < "$SUB_BUNDLE" | tr -d ' ') bytes)"
echo "Report: ${SUB_DIR}/BUILD-REPORT.txt"

if [[ $PREVIEW -eq 1 ]]; then
  cp "$SUB_BUNDLE" "${PREVIEW_DIR}/${BUNDLE_NAME}"
  cp "${ROOT}/style.css" "${PREVIEW_DIR}/style.css"
  mkdir -p "${PREVIEW_DIR}/libraries"
  if [[ -f "${ROOT}/libraries/p5.min.js" ]]; then
    cp "${ROOT}/libraries/p5.min.js" "${PREVIEW_DIR}/libraries/p5.min.js"
    P5_SCRIPT='  <script src="libraries/p5.min.js"></script>'
  else
    P5_SCRIPT="  <script src=\"https://cdn.jsdelivr.net/npm/p5@${P5_VERSION}/lib/p5.min.js\"></script>"
  fi
  cat > "${PREVIEW_DIR}/index.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prototypes — submission preview</title>
  <link rel="stylesheet" type="text/css" href="style.css">
${P5_SCRIPT}
</head>
<body>
  <script src="${BUNDLE_NAME}"></script>
</body>
</html>
EOF
  echo "Preview: ${PREVIEW_DIR}/index.html"
fi
