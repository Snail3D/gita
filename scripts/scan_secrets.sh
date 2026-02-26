#!/usr/bin/env bash

set -e

# Basic secret scanning script
# Scans all files tracked by git for common secret patterns

echo "🔍 Scanning for hardcoded secrets..."

PATTERNS=(
  "AKIA[0-9A-Z]{16}" # AWS Key
  "sk_live_[0-9a-zA-Z]{24}" # Stripe
  "sk_[a-zA-Z0-9]{32,}" # Generic Secret Key
  "ey[A-Za-z0-9_-]{10,}\." # JWT/Tokens
  "(password|secret|token|api_key|apikey)[ \t]*[=:][ \t]*['\"][a-zA-Z0-9\-_]{16,}['\"]" # Generic assignments
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Use grep on all tracked files
  if git ls-files | grep -v "\.env\.example$" | xargs grep -E "$pattern" --color=always 2>/dev/null; then
    echo "🚨 WARNING: Potential secret found matching pattern: $pattern"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "❌ Secret scan failed! Please remove hardcoded secrets."
  exit 1
else
  echo "✅ No hardcoded secrets found!"
  exit 0
fi
