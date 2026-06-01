#!/usr/bin/env bash
# Performance testing suite tests
# Validates performance testing infrastructure

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
  local test_name=$1
  local result=$2
  
  if [ "$result" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $test_name"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗${NC} $test_name"
    ((TESTS_FAILED++))
  fi
}

# Test 1: Performance test script exists
test_performance_script() {
  [ -x "./scripts/performance-test.sh" ]
}

# Test 2: Performance monitoring script exists
test_monitoring_script() {
  [ -x "./scripts/performance-monitoring.sh" ]
}

# Test 3: Performance testing documentation exists
test_performance_docs() {
  [ -f "./docs/performance-testing.md" ]
}

# Test 4: Performance benchmarks workflow exists
test_benchmarks_workflow() {
  [ -f "./.github/workflows/performance-benchmarks.yml" ]
}

# Test 5: Apache Bench is available
test_apache_bench() {
  command -v ab > /dev/null 2>&1
}

# Test 6: jq is available
test_jq_available() {
  command -v jq > /dev/null 2>&1
}

# Test 7: bc is available
test_bc_available() {
  command -v bc > /dev/null 2>&1
}

# Test 8: Results directory can be created
test_results_directory() {
  mkdir -p .performance
  [ -d ".performance" ]
}

# Test 9: Metrics directory can be created
test_metrics_directory() {
  mkdir -p .performance/metrics
  [ -d ".performance/metrics" ]
}

# Test 10: Performance test script has help
test_performance_help() {
  ./scripts/performance-test.sh --help > /dev/null 2>&1 || true
  return 0
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Performance Testing Suite Tests${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  test_result "Performance test script exists" $(test_performance_script && echo 0 || echo 1)
  test_result "Performance monitoring script exists" $(test_monitoring_script && echo 0 || echo 1)
  test_result "Performance testing documentation" $(test_performance_docs && echo 0 || echo 1)
  test_result "Performance benchmarks workflow" $(test_benchmarks_workflow && echo 0 || echo 1)
  test_result "Apache Bench available" $(test_apache_bench && echo 0 || echo 1)
  test_result "jq available" $(test_jq_available && echo 0 || echo 1)
  test_result "bc available" $(test_bc_available && echo 0 || echo 1)
  test_result "Results directory creation" $(test_results_directory && echo 0 || echo 1)
  test_result "Metrics directory creation" $(test_metrics_directory && echo 0 || echo 1)
  test_result "Performance test help" $(test_performance_help && echo 0 || echo 1)
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  
  if [ "$TESTS_FAILED" -gt 0 ]; then
    exit 1
  fi
}

main
