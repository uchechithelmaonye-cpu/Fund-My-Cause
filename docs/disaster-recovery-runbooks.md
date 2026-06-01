# Disaster Recovery Runbooks

Quick reference guides for common disaster recovery scenarios.

## Runbook 1: Emergency Contract Redeployment

**Trigger**: Contract is unresponsive, behaving incorrectly, or needs immediate update  
**Time**: 30 minutes  
**Severity**: HIGH

### Prerequisites
- Access to GitHub repository
- Stellar CLI installed
- Testnet/Mainnet secret key available

### Steps

1. **Assess the situation**
   ```bash
   # Check contract status
   stellar contract info --id <CONTRACT_ID> --network testnet
   
   # Review recent transactions
   git log --oneline -10
   ```

2. **Restore from backup**
   ```bash
   # List available backups
   ./scripts/backup.sh --list
   
   # Restore from last known good backup
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

3. **Verify contract code**
   ```bash
   # Build contract
   cargo build --release --target wasm32-unknown-unknown
   
   # Check WASM size
   ls -lh target/wasm32-unknown-unknown/release/crowdfund.wasm
   ```

4. **Deploy new instance**
   ```bash
   # Set environment variables
   export CREATOR_ADDRESS="<creator>"
   export TOKEN_ADDRESS="<token>"
   export GOAL="1000"
   export DEADLINE=$(date -d "+30 days" +%s)
   
   # Deploy
   ./scripts/deploy.sh $CREATOR_ADDRESS $TOKEN_ADDRESS $GOAL $DEADLINE
   ```

5. **Update frontend configuration**
   ```bash
   # Edit environment file
   nano apps/interface/.env.local
   
   # Update NEXT_PUBLIC_CONTRACT_ID with new contract ID
   ```

6. **Verify functionality**
   ```bash
   # Test contract operations
   cd apps/interface
   npm run test
   ```

7. **Notify users**
   - Post status update to GitHub Discussions
   - Update status page
   - Send notification to stakeholders

### Rollback
If new deployment fails:
```bash
# Revert to previous contract ID in frontend
git checkout apps/interface/.env.local

# Restart frontend
npm run dev
```

---

## Runbook 2: Data Loss Recovery

**Trigger**: Configuration files deleted, environment variables lost, or data corruption  
**Time**: 1 hour  
**Severity**: HIGH

### Prerequisites
- Backup files available
- Write access to repository
- Database access (if applicable)

### Steps

1. **Identify what's missing**
   ```bash
   # Check for missing files
   ls -la .env.production
   ls -la Cargo.lock
   ls -la contracts/
   ```

2. **Restore from backup**
   ```bash
   # List backups
   ./scripts/backup.sh --list
   
   # Restore specific backup
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

3. **Verify restored data**
   ```bash
   # Check file integrity
   cat .env.production
   cat Cargo.lock
   
   # Verify checksums if available
   md5sum -c backup-metadata.txt
   ```

4. **Rebuild if necessary**
   ```bash
   # Clean build
   cargo clean
   cargo build --release --target wasm32-unknown-unknown
   ```

5. **Test restored configuration**
   ```bash
   # Verify environment variables
   source .env.production
   echo $NEXT_PUBLIC_CONTRACT_ID
   
   # Test contract interaction
   cargo test --release
   ```

6. **Commit recovery**
   ```bash
   git add .
   git commit -m "chore: restore from backup after data loss"
   git push origin main
   ```

### Prevention
- Enable branch protection
- Require PR reviews
- Automated backups
- Access controls

---

## Runbook 3: Infrastructure Failure

**Trigger**: GitHub Actions unavailable, deployment pipeline broken, or cloud provider outage  
**Time**: 2 hours  
**Severity**: CRITICAL

### Prerequisites
- Local Stellar CLI installed
- Secret key available locally
- Network connectivity

### Steps

1. **Check service status**
   ```bash
   # Check GitHub status
   curl https://www.githubstatus.com/api/v2/status.json
   
   # Check Stellar network
   curl https://horizon-testnet.stellar.org/
   ```

2. **Use local backup**
   ```bash
   # Restore from local backup
   ./scripts/backup.sh --restore backup-20260427-144626
   ```

3. **Manual deployment**
   ```bash
   # Build contract locally
   cargo build --release --target wasm32-unknown-unknown
   
   # Deploy using local Stellar CLI
   stellar contract upload \
     --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
     --source $STELLAR_SECRET_KEY \
     --network testnet
   ```

4. **Update configuration**
   ```bash
   # Update contract IDs
   export NEW_CONTRACT_ID="<deployed-contract-id>"
   
   # Update frontend
   sed -i "s/NEXT_PUBLIC_CONTRACT_ID=.*/NEXT_PUBLIC_CONTRACT_ID=$NEW_CONTRACT_ID/" \
     apps/interface/.env.local
   ```

5. **Redeploy frontend**
   ```bash
   # Build frontend
   cd apps/interface
   npm run build
   
   # Deploy to hosting (manual or via alternative CI/CD)
   npm run deploy
   ```

6. **Verify service**
   ```bash
   # Test contract
   stellar contract invoke \
     --id $NEW_CONTRACT_ID \
     --source $STELLAR_SECRET_KEY \
     --network testnet \
     -- get_stats
   ```

7. **Resume normal operations**
   - Monitor GitHub Actions recovery
   - Sync manual changes back to repository
   - Resume automated deployments

### Monitoring
- Watch GitHub status page
- Monitor Stellar network status
- Check deployment logs

---

## Runbook 4: Security Breach Response

**Trigger**: Unauthorized access detected, secrets compromised, or malicious activity  
**Time**: 15 minutes (immediate action)  
**Severity**: CRITICAL

### Prerequisites
- Access to GitHub repository settings
- Ability to revoke secrets
- Communication channels

### Immediate Actions (0-5 minutes)

1. **Revoke compromised secrets**
   ```bash
   # Go to GitHub Settings → Secrets and variables → Actions
   # Delete compromised secrets immediately
   
   # Revoke API keys with service providers
   # Contact cloud provider if needed
   ```

2. **Disable affected workflows**
   ```bash
   # Disable deployment workflows temporarily
   # Go to Actions → Disable workflows
   ```

3. **Notify team**
   - Send urgent notification to team
   - Create incident channel
   - Document timeline

### Investigation (5-30 minutes)

4. **Review access logs**
   ```bash
   # Check GitHub audit log
   # Settings → Audit log
   
   # Review deployment logs
   git log --all --oneline
   ```

5. **Identify breach vector**
   ```bash
   # Check for suspicious commits
   git log --all --author="unknown" --oneline
   
   # Review recent changes
   git diff HEAD~10 HEAD
   ```

6. **Assess damage**
   - What secrets were exposed?
   - What systems were accessed?
   - What data was compromised?

### Recovery (30-60 minutes)

7. **Generate new secrets**
   ```bash
   # Generate new API keys
   ./scripts/rotate-secrets.sh --force
   
   # Update all service integrations
   ```

8. **Restore from clean backup**
   ```bash
   # Use backup from before breach
   ./scripts/backup.sh --restore backup-20260425-020000
   ```

9. **Redeploy with new secrets**
   ```bash
   # Update GitHub secrets
   # Settings → Secrets and variables → Actions
   
   # Trigger deployment
   gh workflow run deploy-testnet.yml
   ```

10. **Verify integrity**
    ```bash
    # Check contract state
    stellar contract info --id <CONTRACT_ID> --network testnet
    
    # Verify no unauthorized changes
    git log --oneline -20
    ```

### Post-Incident (1-24 hours)

11. **Audit and investigation**
    - Review all access logs
    - Identify all affected systems
    - Document incident timeline
    - Create incident report

12. **Implement preventive measures**
    - Enable branch protection
    - Require code reviews
    - Add secret scanning
    - Implement access controls

13. **Communication**
    - Notify affected users
    - Post incident report
    - Share lessons learned
    - Update security procedures

### Escalation
- **Severity**: CRITICAL
- **Escalate to**: Security team, Management
- **Communication**: Immediate notification required

---

## Runbook 5: Database Recovery

**Trigger**: Database corruption, data loss, or query failures  
**Time**: 1 hour  
**Severity**: HIGH

### Prerequisites
- Database backup available
- Database admin access
- Backup restoration tools

### Steps

1. **Identify the issue**
   ```bash
   # Check database status
   # Connect to database and run diagnostics
   
   # Check for errors in logs
   tail -f /var/log/database.log
   ```

2. **Stop affected services**
   ```bash
   # Stop application
   docker-compose down
   
   # Prevent further writes
   ```

3. **Restore from backup**
   ```bash
   # List available backups
   ls -la backups/
   
   # Restore database
   # Command depends on database system
   ```

4. **Verify data integrity**
   ```bash
   # Run consistency checks
   # Verify record counts
   # Check for corruption
   ```

5. **Rebuild indexes**
   ```bash
   # Rebuild database indexes
   # Optimize performance
   ```

6. **Restart services**
   ```bash
   # Start application
   docker-compose up -d
   
   # Verify connectivity
   ```

7. **Test functionality**
   ```bash
   # Run smoke tests
   npm run test:smoke
   
   # Verify data is accessible
   ```

---

## Quick Reference

### Emergency Contacts
- **DevOps Lead**: [Contact info]
- **Security Team**: [Contact info]
- **Infrastructure**: [Contact info]

### Important URLs
- GitHub: https://github.com/Fund-My-Cause/Fund-My-Cause
- Stellar Testnet: https://soroban-testnet.stellar.org
- Status Page: [Status page URL]

### Key Commands
```bash
# List backups
./scripts/backup.sh --list

# Restore backup
./scripts/backup.sh --restore <backup-id>

# Deploy contract
./scripts/deploy.sh <creator> <token> <goal> <deadline>

# Rotate secrets
./scripts/rotate-secrets.sh --force

# Check contract status
stellar contract info --id <CONTRACT_ID> --network testnet
```

### Escalation Matrix
| Scenario | Time | Escalate To |
|----------|------|-------------|
| Data loss | 1 hour | DevOps Lead |
| Security breach | 15 min | Security Team |
| Infrastructure failure | 2 hours | Infrastructure Team |
| Contract failure | 30 min | DevOps Lead |

---

## Testing Runbooks

Runbooks should be tested monthly:

1. **Select a runbook**
2. **Create test environment**
3. **Execute runbook steps**
4. **Document results**
5. **Update runbook if needed**

Last tested: [Date]  
Next test: [Date]
