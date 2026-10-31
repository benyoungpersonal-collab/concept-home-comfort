#!/usr/bin/env bash
# Deploys one built preview to Cloudflare Pages.
#
#   scripts/deploy-preview.sh NAME        (after: node scripts/build-preview.mjs prospects/NAME.json)
#
# Needs two environment variables (prospects/README.md explains where to get them):
#   CLOUDFLARE_API_TOKEN    a token with "Cloudflare Pages: Edit" permission
#   CLOUDFLARE_ACCOUNT_ID   from the Cloudflare dashboard
#
# Each prospect gets its own Pages project named byw-NAME, so the link is https://byw-NAME.pages.dev/
set -euo pipefail
NAME="${1:?Usage: scripts/deploy-preview.sh NAME}"
DIR="previews/$NAME"
PROJECT="byw-$NAME"
[ -f "$DIR/index.html" ] || { echo "No $DIR/index.html. Run: node scripts/build-preview.mjs prospects/$NAME.json"; exit 1; }
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN first (see prospects/README.md)}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID first (see prospects/README.md)}"
# Create the project the first time. If it already exists this fails quietly and we move on.
npx --yes wrangler pages project create "$PROJECT" --production-branch main >/dev/null 2>&1 || true
npx --yes wrangler pages deploy "$DIR" --project-name "$PROJECT" --branch main --commit-dirty=true
echo
echo "Preview is live at: https://$PROJECT.pages.dev/"
echo "To take it down later: npx wrangler pages project delete $PROJECT"
