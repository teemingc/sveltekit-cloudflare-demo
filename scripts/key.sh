#!/bin/sh
# Prints a key for the files that affect the tests, as a step output for the workflow.
# Documentation and the results themselves don't count as a change
set -e
git add package.json pnpm-lock.yaml
echo "key=tested-$(git ls-files -s -- . ':!*.md' | git hash-object --stdin)"
