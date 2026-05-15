#!/usr/bin/env bash
# DESIGN-02 phase-final guard: assert that the production bundle contains zero references
# to Google Fonts CDN. v1.0's privacy claim was technically inaccurate; v2.0 closes the gap
# by self-hosting via @fontsource-variable/* packages.
#
# Exits 0 if no matches found. Exits non-zero (with diagnostic output) if any reference exists.
set -euo pipefail

DIST_DIR="${1:-dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: dist directory not found at $DIST_DIR — run 'pnpm run build' first" >&2
  exit 2
fi

# grep -R follows symlinks if any; -l lists matching filenames; -E for alternation
# The legacy app under dist/legacy/ DOES legitimately reference Google Fonts (v1.0 HTML);
# we exclude that path from the check.
MATCHES=$(grep -RlE "fonts\.googleapis\.com|fonts\.gstatic\.com" "$DIST_DIR" --exclude-dir=legacy 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "FAIL: Google Fonts CDN references found in $DIST_DIR (excluding legacy/):" >&2
  echo "$MATCHES" | sed 's/^/  /' >&2
  echo "" >&2
  echo "DESIGN-02 requires zero references to fonts.googleapis.com or fonts.gstatic.com." >&2
  echo "Fix by:" >&2
  echo "  1. Confirm src/main.tsx imports '@fontsource-variable/dm-sans' and '@fontsource-variable/playfair-display'" >&2
  echo "  2. Confirm no <link href='https://fonts.googleapis.com/...'> in index.html" >&2
  echo "  3. Confirm src/styles/theme.css does not @import or url() a Google Fonts (fonts.gstatic.com) URL" >&2
  exit 1
fi

echo "OK: no Google Fonts CDN references in $DIST_DIR (excluding legacy/) — DESIGN-02 holds"
