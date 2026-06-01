# Performance Testing Guide

Comprehensive performance testing and monitoring for Fund-My-Cause.

## Overview

The performance testing suite includes:
- Load testing with Apache Bench
- Stress testing with sustained load
- Endpoint performance testing
- Continuous performance monitoring
- Baseline comparison and alerting

## Prerequisites

- Apache Bench (`ab`)
- curl
- jq (for JSON parsing)
- bc (for calculations)

### Installation

```bash
# Ubuntu/Debian
sudo apt-get install apache2-utils curl jq bc

# macOS
brew install httpd curl jq bc
```

## Load Testing

### Quick Load Test

```bash
./scripts/performance-test.sh
```

### Custom Load Test

```bash
# 500 requests with 20 concurrent users
REQUESTS=500 CONCURRENT_USERS=20 ./scripts/performance-test.sh

# Against staging environment
TARGET_URL=https://staging.fund-my-cause.example.com ./scripts/performance-test.sh
```

### Interpreting Results

```
Mean response time: 45.23ms
  - Target: < 100ms
  - Warning: 100-200ms
  - Critical: > 200ms

Requests per second: 22.1
  - Target: > 20 req/s
  - Warning: 10-20 req/s
  - Critical: < 10 req/s

Failed requests: 0
  - Target: 0 failures
  - Warning: < 1%
  - Critical: > 1%
```

## Stress Testing

### Run Stress Test

```bash
# 60 second stress test with 50 concurrent users
DURATION=60 CONCURRENT_USERS=50 ./scripts/performance-test.sh
```

### Stress Test Scenarios

**Light Load** (baseline)
```bash
CONCURRENT_USERS=5 REQUESTS=100 ./scripts/performance-test.sh
```

**Medium Load** (typical)
```bash
CONCURRENT_USERS=20 REQUESTS=500 ./scripts/performance-test.sh
```

**Heavy Load** (peak)
```bash
CONCURRENT_USERS=100 REQUESTS=2000 ./scripts/performance-test.sh
```

**Extreme Load** (breaking point)
```bash
CONCURRENT_USERS=500 DURATION=120 ./scripts/performance-test.sh
```

## Performance Monitoring

### Continuous Monitoring

```bash
# Monitor with default 60s interval
./scripts/performance-monitoring.sh monitor http://localhost:3000

# Custom interval (30 seconds)
COLLECTION_INTERVAL=30 ./scripts/performance-monitoring.sh monitor http://localhost:3000
```

### One-Time Collection

```bash
./scripts/performance-monitoring.sh collect http://localhost:3000
```

### Generate Report

```bash
./scripts/performance-monitoring.sh report
```

### Check Alerts

```bash
./scripts/performance-monitoring.sh check
```

## Performance Baselines

### Establish Baseline

```bash
# First run establishes baseline
./scripts/performance-test.sh

# Baseline stored in .performance/baseline.json
cat .performance/baseline.json
```

### Compare Against Baseline

```bash
# Automatically compares new results with baseline
./scripts/performance-test.sh

# Shows percentage difference
# ✓ Performance within acceptable range (< 10% degradation)
# ⚠ Performance degradation detected (> 10%)
```

## Alert Thresholds

Configure alert thresholds:

```bash
# Response time threshold (ms)
ALERT_THRESHOLD_RESPONSE_TIME=500 ./scripts/performance-monitoring.sh monitor

# Error rate threshold (%)
ALERT_THRESHOLD_ERROR_RATE=5 ./scripts/performance-monitoring.sh monitor
```

### Default Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Response Time | > 500ms | Alert |
| Error Rate | > 5% | Alert |
| CPU Usage | > 80% | Warning |
| Memory Usage | > 80% | Warning |

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y apache2-utils jq bc

      - name: Build and start application
        run: |
          docker build -f apps/interface/Dockerfile -t fund-my-cause .
          docker run -d -p 3000:3000 fund-my-cause

      - name: Wait for application
        run: sleep 10

      - name: Run performance tests
        run: ./scripts/performance-test.sh

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: .performance/

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('.performance/load_test_results.json', 'utf8'));
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 📊 Performance Test Results
              
              | Metric | Value |
              |--------|-------|
              | Mean Response Time | ${results.mean_response_time_ms}ms |
              | Requests/sec | ${results.requests_per_second} |
              | Failed Requests | ${results.failed_requests} |
              `
            })
```

## Performance Optimization Tips

### Frontend Optimization

1. **Code Splitting**
   ```bash
   # Check bundle size
   npm run build
   ls -lh apps/interface/.next/static/chunks/
   ```

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize images before upload
   - Use WebP format

3. **Caching**
   - Enable browser caching
   - Use CDN for static assets
   - Cache API responses

### Backend Optimization

1. **Database Queries**
   - Add indexes
   - Use query optimization
   - Implement caching

2. **API Response**
   - Minimize payload size
   - Use compression (gzip)
   - Implement pagination

3. **Infrastructure**
   - Use load balancing
   - Scale horizontally
   - Monitor resource usage

## Troubleshooting

### High Response Times

```bash
# Check system resources
top -b -n 1 | head -20

# Check network latency
ping -c 5 localhost

# Check application logs
docker logs fund-my-cause
```

### High Error Rate

```bash
# Check application health
curl -v http://localhost:3000/health

# Check error logs
docker logs fund-my-cause | grep ERROR

# Check database connectivity
curl -v http://localhost:3000/api/campaigns
```

### Memory Leaks

```bash
# Monitor memory over time
watch -n 1 'free -h'

# Check for memory leaks in application
docker stats fund-my-cause
```

## References

- [Apache Bench Documentation](https://httpd.apache.org/docs/2.4/programs/ab.html)
- [Performance Testing Best Practices](https://www.perfmatrix.com/performance-testing-tutorial/)
- [Web Performance Optimization](https://web.dev/performance/)
