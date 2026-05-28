# Security Audit Checklist

## Purpose
Provide a structured security checklist for the project, document requirements, and define automated checks that can be executed during development and CI.

## Security requirements
- All contract inputs must be validated.
- No `unwrap()` or `panic!` calls in production Rust code.
- No hardcoded secrets, keys, or Stellar addresses.
- No unsafe code in contract crates.
- Dependencies must be audited regularly.
- Error messages should not leak sensitive internal state.
- Access control checks must be explicit and test-covered.

## Audit checklist

### Dependency and tooling checks
- [ ] Run `cargo audit` on every PR.
- [ ] Run `cargo geiger` to detect unsafe code.
- [ ] Run `cargo clippy` with security lints enabled.
- [ ] Verify `Cargo.lock` contains known-good dependency versions.

### Code quality checks
- [ ] Avoid `unwrap()` / `expect()` in contract and production code.
- [ ] Avoid `panic!` in contract and production code.
- [ ] Check for TODO/FIXME comments in production code.
- [ ] Ensure `Result` types are used for error propagation.
- [ ] Use explicit authorization checks for any privileged actions.

### Contract-specific checks
- [ ] Ensure no direct arithmetic overflow can occur.
- [ ] Validate deadlines and timestamps against ledger state.
- [ ] Ensure fee calculations are bounded and safe.
- [ ] Confirm refund and withdraw paths cannot be abused.
- [ ] Confirm emergency and delegation flows are restricted correctly.

### Documentation and reporting
- [ ] Record audit findings in `docs/security-audit.md`.
- [ ] Log remediation actions and risk decisions.
- [ ] Maintain an issue tracker for each security finding.

## Automated checks
- `cargo audit`
- `cargo geiger`
- `cargo clippy --all-targets -- -W clippy::unwrap_used -W clippy::expect_used -W clippy::panic`
- Custom grep checks for unsafe patterns:
  - `grep -R "unwrap()\|expect(\|panic!\|TODO\|FIXME" contracts/crowdfund/src`

## Remediation plan
1. Prioritize findings by severity: Critical, High, Medium, Low.
2. Fix critical runtime vulnerabilities first.
3. Update or replace vulnerable dependencies.
4. Add regression tests for any security-related fix.
5. Document the change and verify the automated check suite.

## Reporting
- For dependency vulnerabilities, update `Cargo.toml` / `Cargo.lock` and rerun `cargo audit`.
- For code issues, use targeted refactors and add tests.
- For design issues, document the risk and mitigation in `docs/security-audit.md`.
