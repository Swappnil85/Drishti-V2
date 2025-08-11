#!/usr/bin/env bash
set -euo pipefail

# Find markdown links: [text](link)
# Only check repo-relative links that look like paths without scheme or '#'
status=0
while IFS= read -r -d '' file; do
  while IFS= read -r link; do
    # Extract link target using sed
    target=$(echo "$link" | sed -n 's/.*](\([^)]*\)).*/\1/p')
    # Skip external (http, https, mailto) and anchors and absolute URLs
    if [[ "$target" =~ ^https?:// ]] || [[ "$target" =~ ^mailto: ]] || [[ "$target" =~ ^# ]]; then
      continue
    fi
    # Skip empty
    if [[ -z "$target" ]]; then
      continue
    fi
    # If target contains spaces, quote for test
    if [[ -e "$target" ]]; then
      continue
    fi
    echo "Broken link in $file -> $target"
    status=1
  done < <(grep -oE "\[[^\]]+\]\([^\)]+\)" "$file" || true)
done < <(find DOCS -type f -name "*.md" -print0)

exit $status

