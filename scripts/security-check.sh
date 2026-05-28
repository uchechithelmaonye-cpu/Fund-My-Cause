#!/usr/bin/env bash
set -euo pipefail

echo "Running project security checks..."

echo "\n1. cargo audit"
cargo audit

echo "\n2. cargo geiger"
cargo geiger

echo "\n3. cargo clippy"
cargo clippy --all-targets -- -W clippy::unwrap_used -W clippy::expect_used -W clippy::panic

echo "\n4. Custom production code checks"
grep -R --line-number --exclude-dir=target --exclude-dir=node_modules "unwrap()\|expect(\|panic!\|TODO\|FIXME" contracts/crowdfund/src || true

echo "\nSecurity checks complete."
