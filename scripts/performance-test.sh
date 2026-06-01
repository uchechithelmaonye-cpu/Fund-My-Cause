#!/usr/bin/env bash
# Performance testing suite
# Automated load testing and performance monitoring

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TARGET_URL="${TARGET_URL:-http://localhost:3000}"
CONCURRENT_USERS="${CONCURRENT_USERS:-10}"
REQUESTS="${REQUESTS:-1000}"
DURATION="${DURATION:-60}"
RESULTS_DIR="${RESULTS_DIR:-.performance}"
BASELINE_FILE="$RESULTS_DIR/baseline.json"

mkdir -p "$RESULTS_DIR"

run_load_test() {
  echo -e "${BLUE}Running load test...${NC}"
  echo "  Target: $TARGET_URL"
  echo "  Concurrent users: $CONCURRENT_USERS"
  echo "  Total requests: $REQUESTS"
  echo ""
  
  local output_file="$RESULTS_DIR/load_test_$(date +%s).txt"
  
  # Run Apache Bench
  ab -n "$REQUESTS" -c "$CONCURRENT_USERS" -g "$output_file.tsv" \
    "$TARGET_URL/" > "$output_file" 2>&1 || {
    echo -e "${RED}✗ Load test failed${NC}"
    return 1
  }
  
  # Parse results
  local mean_time=$(grep "Time per request:" "$output_file" | head -1 | awk '{print $4}')
  local requests_per_sec=$(grep "Requests per second:" "$output_file" | awk '{print $4}')
  local failed=$(grep "Failed requests:" "$output_file" | awk '{print $3}')
  local total_time=$(grep "Time taken for tests:" "$output_file" | awk '{print $5}')
  
  echo -e "${GREEN}✓ Load test completed${NC}"
  echo "  Mean response time: ${mean_time}ms"
  echo "  Requests per second: $requests_per_sec"
  echo "  Failed requests: $failed"
  echo "  Total time: ${total_time}s"
  echo ""
  
  # Store results
  cat > "$RESULTS_DIR/load_test_results.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "target_url": "$TARGET_URL",
  "concurrent_users": $CONCURRENT_USERS,
  "total_requests": $REQUESTS,
  "mean_response_time_ms": $mean_time,
  "requests_per_second": $requests_per_sec,
  "failed_requests": $failed,
  "total_time_seconds": $total_time
}
EOF
  
  return 0
}

run_stress_test() {
  echo -e "${BLUE}Running stress test...${NC}"
  echo "  Target: $TARGET_URL"
  echo "  Duration: ${DURATION}s"
  echo ""
  
  local output_file="$RESULTS_DIR/stress_test_$(date +%s).txt"
  
  # Run Apache Bench with time limit
  ab -t "$DURATION" -c "$CONCURRENT_USERS" \
    "$TARGET_URL/" > "$output_file" 2>&1 || {
    echo -e "${RED}✗ Stress test failed${NC}"
    return 1
  }
  
  # Parse results
  local requests=$(grep "Requests per second:" "$output_file" | awk '{print $4}')
  local mean_time=$(grep "Time per request:" "$output_file" | head -1 | awk '{print $4}')
  local failed=$(grep "Failed requests:" "$output_file" | awk '{print $3}')
  
  echo -e "${GREEN}✓ Stress test completed${NC}"
  echo "  Requests per second: $requests"
  echo "  Mean response time: ${mean_time}ms"
  echo "  Failed requests: $failed"
  echo ""
  
  # Store results
  cat > "$RESULTS_DIR/stress_test_results.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "target_url": "$TARGET_URL",
  "duration_seconds": $DURATION,
  "concurrent_users": $CONCURRENT_USERS,
  "requests_per_second": $requests,
  "mean_response_time_ms": $mean_time,
  "failed_requests": $failed
}
EOF
  
  return 0
}

run_endpoint_tests() {
  echo -e "${BLUE}Testing individual endpoints...${NC}"
  echo ""
  
  local endpoints=(
    "/"
    "/api/campaigns"
    "/api/contract/stats"
    "/health"
  )
  
  local results_file="$RESULTS_DIR/endpoint_tests_$(date +%s).json"
  echo "{" > "$results_file"
  
  local first=true
  for endpoint in "${endpoints[@]}"; do
    echo -n "  Testing $endpoint... "
    
    local start=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$TARGET_URL$endpoint" 2>/dev/null || echo "000")
    local end=$(date +%s%N)
    
    local http_code=$(echo "$response" | tail -1)
    local response_time=$(( (end - start) / 1000000 ))
    
    if [ "$http_code" = "200" ]; then
      echo -e "${GREEN}✓${NC} (${response_time}ms)"
      
      if [ "$first" = false ]; then
        echo "," >> "$results_file"
      fi
      first=false
      
      cat >> "$results_file" <<EOF
  "$endpoint": {
    "http_code": $http_code,
    "response_time_ms": $response_time,
    "status": "pass"
  }
EOF
    else
      echo -e "${RED}✗${NC} (HTTP $http_code)"
      
      if [ "$first" = false ]; then
        echo "," >> "$results_file"
      fi
      first=false
      
      cat >> "$results_file" <<EOF
  "$endpoint": {
    "http_code": $http_code,
    "response_time_ms": $response_time,
    "status": "fail"
  }
EOF
    fi
  done
  
  echo "}" >> "$results_file"
  echo ""
}

collect_baseline() {
  echo -e "${BLUE}Collecting performance baseline...${NC}"
  
  if [ -f "$BASELINE_FILE" ]; then
    echo -e "${YELLOW}Baseline already exists${NC}"
    return 0
  fi
  
  # Run quick load test for baseline
  local output_file=$(mktemp)
  ab -n 100 -c 5 "$TARGET_URL/" > "$output_file" 2>&1 || {
    echo -e "${RED}✗ Baseline collection failed${NC}"
    return 1
  }
  
  local mean_time=$(grep "Time per request:" "$output_file" | head -1 | awk '{print $4}')
  local requests_per_sec=$(grep "Requests per second:" "$output_file" | awk '{print $4}')
  
  cat > "$BASELINE_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mean_response_time_ms": $mean_time,
  "requests_per_second": $requests_per_sec
}
EOF
  
  echo -e "${GREEN}✓ Baseline collected${NC}"
  echo "  Mean response time: ${mean_time}ms"
  echo "  Requests per second: $requests_per_sec"
  echo ""
  
  rm -f "$output_file"
}

compare_with_baseline() {
  echo -e "${BLUE}Comparing with baseline...${NC}"
  
  if [ ! -f "$BASELINE_FILE" ]; then
    echo -e "${YELLOW}No baseline available for comparison${NC}"
    return 0
  fi
  
  local baseline_mean=$(jq -r '.mean_response_time_ms' "$BASELINE_FILE")
  local current_mean=$(jq -r '.mean_response_time_ms' "$RESULTS_DIR/load_test_results.json" 2>/dev/null || echo "0")
  
  if [ "$current_mean" = "0" ]; then
    echo -e "${YELLOW}No current results to compare${NC}"
    return 0
  fi
  
  local diff=$(echo "$current_mean - $baseline_mean" | bc)
  local percent=$(echo "scale=2; ($diff / $baseline_mean) * 100" | bc)
  
  echo "Baseline mean response time: ${baseline_mean}ms"
  echo "Current mean response time: ${current_mean}ms"
  echo "Difference: ${diff}ms (${percent}%)"
  
  if (( $(echo "$percent > 10" | bc -l) )); then
    echo -e "${RED}⚠ Performance degradation detected (>10%)${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Performance within acceptable range${NC}"
    return 0
  fi
}

generate_report() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Performance Test Report${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Test Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Target URL: $TARGET_URL"
  echo ""
  
  if [ -f "$RESULTS_DIR/load_test_results.json" ]; then
    echo "Load Test Results:"
    jq '.' "$RESULTS_DIR/load_test_results.json" | sed 's/^/  /'
    echo ""
  fi
  
  if [ -f "$RESULTS_DIR/stress_test_results.json" ]; then
    echo "Stress Test Results:"
    jq '.' "$RESULTS_DIR/stress_test_results.json" | sed 's/^/  /'
    echo ""
  fi
  
  if [ -f "$RESULTS_DIR/endpoint_tests_"* ]; then
    echo "Endpoint Test Results:"
    jq '.' "$RESULTS_DIR/endpoint_tests_"* 2>/dev/null | sed 's/^/  /' || true
    echo ""
  fi
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Performance Testing Suite${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  # Warm up
  echo -e "${BLUE}Warming up...${NC}"
  curl -s "$TARGET_URL/" > /dev/null 2>&1 || {
    echo -e "${RED}✗ Target URL not accessible${NC}"
    exit 1
  }
  echo -e "${GREEN}✓ Target is accessible${NC}"
  echo ""
  
  # Collect baseline if needed
  collect_baseline
  
  # Run tests
  run_load_test || exit 1
  run_stress_test || exit 1
  run_endpoint_tests
  
  # Compare with baseline
  compare_with_baseline || true
  
  # Generate report
  generate_report
}

main
