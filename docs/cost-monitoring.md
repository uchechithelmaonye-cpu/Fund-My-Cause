# Cost Monitoring

This document describes the cost monitoring and optimization infrastructure for Fund-My-Cause.

## Overview

The cost monitoring system tracks:
- **RPC Call Costs** - Soroban RPC endpoint usage
- **Storage Costs** - Contract state and artifact storage
- **Deployment Costs** - Contract deployment and updates
- **Infrastructure Costs** - Compute and networking

## Cost Tracking

### Daily Monitoring

Cost monitoring runs automatically every day at midnight UTC:

```yaml
schedule:
  - cron: '0 0 * * *'
```

### Cost Categories

| Category | Unit | Estimated Cost |
|----------|------|-----------------|
| RPC Calls | per 1000 calls | $0.10 |
| Storage | per GB/month | $0.023 |
| Deployment | per contract | $0.01-0.50 |
| Compute | per hour | $0.01-0.10 |

## Cost Alerts

Alerts trigger when daily costs exceed threshold:

```bash
./scripts/monitor-costs.sh --report --alert-threshold 1000
```

### Alert Levels

- **CRITICAL** (>$1000/day): Immediate investigation required
- **WARNING** ($500-1000/day): Review optimization opportunities
- **INFO** (<$500/day): Normal operation

## Cost Optimization

### RPC Call Optimization

1. **Batch Requests**: Combine multiple RPC calls
2. **Caching**: Cache contract state locally
3. **Polling**: Reduce polling frequency
4. **Indexing**: Use Horizon API for historical data

### Storage Optimization

1. **Contract Size**: Minimize WASM binary size
2. **State Pruning**: Remove old campaign data
3. **Compression**: Compress stored artifacts
4. **Archival**: Move old data to cold storage

### Deployment Optimization

1. **Batch Deployments**: Deploy multiple contracts together
2. **Reuse Contracts**: Share contract instances
3. **Upgrade Strategy**: Plan upgrades to minimize deployments
4. **Testing**: Test thoroughly before deployment

## Weekly Reports

Weekly cost reports are generated every Sunday:

```yaml
schedule:
  - cron: '0 0 * * 0'
```

Reports include:
- Daily average costs
- Weekly totals
- Monthly projections
- Trend analysis
- Optimization recommendations

## Cost Reporting

### Generate Report

```bash
./scripts/monitor-costs.sh --report
```

### Report Contents

```json
{
  "report_date": "2026-06-01T00:00:00Z",
  "costs": {
    "rpc_calls": {
      "amount": 0.0001,
      "calls_count": 1000
    },
    "storage": {
      "amount": 0.0001,
      "size_bytes": 1000000
    },
    "deployment": {
      "amount": 0.01
    }
  },
  "summary": {
    "daily_cost": 0.0102,
    "monthly_projection": 0.306,
    "yearly_projection": 3.673,
    "alert_triggered": false
  }
}
```

## Cost Tracking Log

Cost tracking is logged to `cost-tracking.log`:

```csv
timestamp,category,amount,description
2026-06-01T00:00:00Z,RPC_CALLS,0.0001,Estimated RPC call costs
2026-06-01T00:00:00Z,STORAGE,0.0001,Storage usage: 1.0M
2026-06-01T00:00:00Z,DEPLOYMENT,0.01,Contract deployment
```

## GitHub Integration

Cost reports are posted to:
- **Pull Requests**: Cost impact of changes
- **Issues**: Weekly cost reports
- **Artifacts**: Detailed cost reports (90-day retention)

## Cost Optimization Checklist

- [ ] Review weekly cost reports
- [ ] Identify high-cost operations
- [ ] Implement caching strategies
- [ ] Optimize contract size
- [ ] Batch RPC calls
- [ ] Archive old data
- [ ] Monitor trend changes
- [ ] Plan capacity adjustments

## Escalation

Cost anomalies require investigation:

1. **Spike Detection**: Alert if daily cost > 2x average
2. **Investigation**: Review logs and metrics
3. **Root Cause**: Identify source of increase
4. **Mitigation**: Implement fix or optimization
5. **Prevention**: Update processes to prevent recurrence

## Tools and Resources

- **Cost Monitoring Script**: `scripts/monitor-costs.sh`
- **Workflow**: `.github/workflows/cost-monitoring.yml`
- **Logs**: `cost-tracking.log`
- **Reports**: `cost-report-*.json`

## Future Enhancements

- [ ] Integration with cloud provider billing APIs
- [ ] Machine learning-based cost prediction
- [ ] Automated cost optimization recommendations
- [ ] Budget enforcement and limits
- [ ] Multi-region cost comparison
