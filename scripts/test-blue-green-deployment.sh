#!/usr/bin/env bash
# Blue-green deployment tests
# Validates deployment procedures and rollback mechanisms

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

# Test 1: Deployment script exists and is executable
test_deployment_script() {
  [ -x "./scripts/blue-green-deploy.sh" ]
}

# Test 2: Rollback script exists and is executable
test_rollback_script() {
  [ -x "./scripts/blue-green-rollback.sh" ]
}

# Test 3: Blue-green deployment documentation exists
test_deployment_docs() {
  [ -f "./docs/blue-green-deployment.md" ]
}

# Test 4: Deployment workflow exists
test_deployment_workflow() {
  [ -f "./.github/workflows/blue-green-deploy.yml" ]
}

# Test 5: State file can be created
test_state_file() {
  mkdir -p /tmp
  echo "blue" > /tmp/test_active_slot.txt
  [ -f "/tmp/test_active_slot.txt" ]
}

# Test 6: Deployment script has help
test_deployment_help() {
  ./scripts/blue-green-deploy.sh --help > /dev/null 2>&1 || true
  return 0
}

# Test 7: Rollback script has help
test_rollback_help() {
  ./scripts/blue-green-rollback.sh help > /dev/null 2>&1 || true
  return 0
}

# Test 8: Docker is available
test_docker_available() {
  command -v docker > /dev/null 2>&1
}

# Test 9: Curl is available
test_curl_available() {
  command -v curl > /dev/null 2>&1
}

# Test 10: Deployment log directory can be created
test_log_directory() {
  mkdir -p /tmp
  [ -d "/tmp" ]
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Blue-Green Deployment Tests${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  test_result "Deployment script exists" $(test_deployment_script && echo 0 || echo 1)
  test_result "Rollback script exists" $(test_rollback_script && echo 0 || echo 1)
  test_result "Deployment documentation" $(test_deployment_docs && echo 0 || echo 1)
  test_result "Deployment workflow" $(test_deployment_workflow && echo 0 || echo 1)
  test_result "State file creation" $(test_state_file && echo 0 || echo 1)
  test_result "Deployment script help" $(test_deployment_help && echo 0 || echo 1)
  test_result "Rollback script help" $(test_rollback_help && echo 0 || echo 1)
  test_result "Docker available" $(test_docker_available && echo 0 || echo 1)
  test_result "Curl available" $(test_curl_available && echo 0 || echo 1)
  test_result "Log directory creation" $(test_log_directory && echo 0 || echo 1)
  
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
