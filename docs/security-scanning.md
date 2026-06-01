# Security Scanning

This document describes the automated security scanning infrastructure for Fund-My-Cause.

## Overview

The security scanning pipeline includes:
- **SAST** (Static Application Security Testing) - Code vulnerability detection
- **Dependency Scanning** - Vulnerable dependency detection
- **Container Scanning** - Docker image vulnerability detection
- **Secret Scanning** - Credential and API key detection
- **Code Quality** - Rust and TypeScript linting
- **SCA** (Software Composition Analysis) - Open source component analysis

## Scanning Tools

### SAST - Semgrep
- **Purpose**: Detect code vulnerabilities and security issues
- **Frequency**: On push, PR, and daily
- **Coverage**: Rust, TypeScript, Dockerfile
- **Results**: Uploaded to GitHub Security tab

### Dependency Scanning - Cargo Audit & npm audit
- **Purpose**: Identify vulnerable dependencies
- **Frequency**: On push, PR, and daily
- **Coverage**: Rust crates and npm packages
- **Action**: Fails on moderate or higher vulnerabilities

### Container Scanning - Trivy
- **Purpose**: Scan Docker images for vulnerabilities
- **Frequency**: On push, PR, and daily
- **Severity**: Reports HIGH and CRITICAL issues
- **Results**: Uploaded to GitHub Security tab

### Secret Scanning - TruffleHog
- **Purpose**: Detect exposed credentials and API keys
- **Frequency**: On push, PR, and daily
- **Verification**: Only reports verified secrets
- **Action**: Fails if secrets detected

### Code Quality - Clippy & rustfmt
- **Purpose**: Enforce code quality standards
- **Frequency**: On push and PR
- **Rules**: All clippy lints + pedantic + security
- **Action**: Fails on warnings

### SCA - OWASP Dependency-Check
- **Purpose**: Analyze open source components
- **Frequency**: On push, PR, and daily
- **Features**: Experimental and retired component detection
- **Results**: Uploaded to GitHub Security tab

## Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

## GitHub Security Integration

All scan results are automatically uploaded to GitHub's Security tab:
1. Navigate to **Security** → **Code scanning alerts**
2. Review findings by severity
3. Dismiss false positives with justification
4. Track remediation progress

## Local Security Scanning

Run security scans locally before pushing:

```bash
# Cargo audit
cargo audit

# Clippy
cargo clippy --all-targets --all-features -- -W clippy::all

# npm audit
cd apps/interface && npm audit

# Semgrep (requires installation)
semgrep --config=p/security-audit .
```

## Remediation Process

1. **Review**: Check GitHub Security tab for findings
2. **Assess**: Determine if finding is valid or false positive
3. **Fix**: Apply security patch or code fix
4. **Verify**: Re-run scans to confirm resolution
5. **Document**: Add comment explaining fix

## False Positives

To dismiss false positives in GitHub:
1. Go to Security → Code scanning alerts
2. Click on the alert
3. Click "Dismiss" and select reason
4. Add comment explaining why it's a false positive

## Escalation

Critical findings require immediate action:
- **CRITICAL**: Fix within 24 hours
- **HIGH**: Fix within 1 week
- **MEDIUM**: Fix within 2 weeks
- **LOW**: Fix within 1 month

## Continuous Improvement

Security scanning is continuously improved:
- New tools added as threats evolve
- Rules updated based on industry standards
- False positives reduced through tuning
- Coverage expanded to new components
