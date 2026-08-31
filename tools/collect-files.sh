#!/usr/bin/env bash

set -u

OUTPUT="collected-files.txt"

usage() {
  cat <<'EOF'
Usage:
  ./tools/collect-files.sh [options] <file> [file ...]

Options:
  -o, --output <file>   Output .txt filename
  -h, --help            Show this help

Examples:
  ./tools/collect-files.sh \
    backend/supabase/functions/api/routes/report.routes.ts \
    backend/supabase/functions/api/services/reports.ts

  ./tools/collect-files.sh \
    --output reports-current.txt \
    backend/supabase/functions/api/routes/report.routes.ts \
    backend/supabase/functions/api/services/reports.ts
EOF
}

FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -o|--output)
      if [[ $# -lt 2 ]]; then
        echo "Error: --output requires a filename."
        exit 1
      fi

      OUTPUT="$2"
      shift 2
      ;;

    -h|--help)
      usage
      exit 0
      ;;

    -*)
      echo "Error: Unknown option: $1"
      usage
      exit 1
      ;;

    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Error: No files specified."
  echo
  usage
  exit 1
fi

: > "$OUTPUT"

echo "WorkPulse File Collection" >> "$OUTPUT"
echo "Generated: $(date)" >> "$OUTPUT"
echo "============================================================" >> "$OUTPUT"
echo "" >> "$OUTPUT"

for FILE in "${FILES[@]}"; do
  echo "============================================================" >> "$OUTPUT"
  echo "FILE: $FILE" >> "$OUTPUT"
  echo "============================================================" >> "$OUTPUT"

  if [[ -f "$FILE" ]]; then
    cat "$FILE" >> "$OUTPUT"
  else
    echo "[FILE NOT FOUND]" >> "$OUTPUT"
  fi

  echo "" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
done

echo "============================================================" >> "$OUTPUT"
echo "Collection complete." >> "$OUTPUT"

echo "Created: $OUTPUT"