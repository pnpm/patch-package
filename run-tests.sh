#!/usr/bin/env bash
set -e

export CI=true

pnpm clean
pnpm build
version=$(node -e 'console.log(require("./package.json").version)')
pnpm version --new-version 0.0.0 --no-git-tag-version --no-commit-hooks
pnpm pack --filename patch-package.test.$(date +%s).tgz
pnpm version --new-version $version --no-git-tag-version --no-commit-hooks
pnpm jest "$@"
