#!/usr/bin/env bash
# usage: post-evidence.sh <issue-number> <comment-markdown-file>
# Commits $EV/issue-<n>/ to the dogfood-evidence branch, pushes, then posts the
# comment (with {{img:name.png}} placeholders replaced by raw GitHub URLs).
set -euo pipefail
n=$1; body=$2
cd "$EV"
git add "issue-$n" && git commit -qm "Evidence for #$n" || true
git push -q fork dogfood-evidence 2>/dev/null || git push -q -u fork dogfood-evidence
sha=$(git rev-parse HEAD)
base="https://raw.githubusercontent.com/jofftiquez/vue-html-to-paper/$sha/issue-$n"
sed -E "s#\{\{img:([^}]+)\}\}#![\1]($base/\1)#g" "$body" > "$body.out"
gh issue comment "$n" -R jofftiquez/vue-html-to-paper -F "$body.out"
