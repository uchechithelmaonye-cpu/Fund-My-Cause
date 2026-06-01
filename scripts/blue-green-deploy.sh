#!/usr/bin/env bash
# Blue-green deployment automation script
# Manages zero-downtime deployments with automatic rollback

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-staging}"
BLUE_PORT="${BLUE_PORT:-3000}"
GREEN_PORT="${GREEN_PORT:-3001}"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=2
STATE_FILE="/tmp/${ENVIRONMENT}_active_slot.txt"
DEPLOYMENT_LOG="/tmp/${ENVIRONMENT}_deployment.log"

# Ensure state file exists
mkdir -p "$(dirname "$STATE_FILE")"
[ -f "$STATE_FILE" ] || echo "blue" > "$STATE_FILE"

get_active_slot() {
  cat "$STATE_FILE"
}

get_inactive_slot() {
  local active=$(get_active_slot)
  if [ "$active" = "blue" ]; then
    echo "green"
  else
    echo "blue"
  fi
}

get_port_for_slot() {
  local slot=$1
  if [ "$slot" = "blue" ]; then
    echo "$BLUE_PORT"
  else
    echo "$GREEN_PORT"
  fi
}

log_deployment() {
  local message=$1
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "$timestamp - $message" >> "$DEPLOYMENT_LOG"
}

build_image() {
  local slot=$1
  local timestamp=$(date +%s)
  
  echo -e "${BLUE}Building Docker image for $slot slot...${NC}"
  
  docker build \
    -f apps/interface/Dockerfile \
    -t "fund-my-cause:${slot}-${timestamp}" \
    -t "fund-my-cause:${slot}-latest" \
    . || {
    echo -e "${RED}✗ Build failed${NC}"
    log_deployment "Build failed for $slot"
    return 1
  }
  
  echo -e "${GREEN}✓ Image built successfully${NC}"
  log_deployment "Image built for $slot: fund-my-cause:${slot}-${timestamp}"
}

deploy_to_slot() {
  local slot=$1
  local port=$(get_port_for_slot "$slot")
  local container_name="fund-my-cause-$slot"
  
  echo -e "${BLUE}Deploying to $slot slot (port $port)...${NC}"
  
  # Stop existing container
  docker stop "$container_name" 2>/dev/null || true
  docker rm "$container_name" 2>/dev/null || true
  
  # Start new container
  docker run -d \
    --name "$container_name" \
    -p "$port:3000" \
    --env-file "apps/interface/.env.$ENVIRONMENT" \
    "fund-my-cause:${slot}-latest" || {
    echo -e "${RED}✗ Deployment failed${NC}"
    log_deployment "Deployment failed for $slot"
    return 1
  }
  
  echo -e "${GREEN}✓ Container started on port $port${NC}"
  log_deployment "Container deployed to $slot on port $port"
}

wait_for_health() {
  local slot=$1
  local port=$(get_port_for_slot "$slot")
  local attempts=0
  local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
  
  echo -e "${BLUE}Waiting for $slot slot to be healthy...${NC}"
  
  while [ $attempts -lt $max_attempts ]; do
    if curl -sf "http://localhost:${port}/health" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Health check passed${NC}"
      log_deployment "Health check passed for $slot"
      return 0
    fi
    
    attempts=$((attempts + 1))
    echo "  Attempt $attempts/$max_attempts..."
    sleep "$HEALTH_CHECK_INTERVAL"
  done
  
  echo -e "${RED}✗ Health check failed after ${HEALTH_CHECK_TIMEOUT}s${NC}"
  log_deployment "Health check failed for $slot"
  return 1
}

run_smoke_tests() {
  local slot=$1
  local port=$(get_port_for_slot "$slot")
  
  echo -e "${BLUE}Running smoke tests on $slot slot...${NC}"
  
  # Test homepage
  if ! curl -sf "http://localhost:${port}/" > /dev/null 2>&1; then
    echo -e "${RED}✗ Homepage test failed${NC}"
    log_deployment "Homepage test failed for $slot"
    return 1
  fi
  
  # Test API
  if ! curl -sf "http://localhost:${port}/api/campaigns" > /dev/null 2>&1; then
    echo -e "${RED}✗ API test failed${NC}"
    log_deployment "API test failed for $slot"
    return 1
  fi
  
  echo -e "${GREEN}✓ Smoke tests passed${NC}"
  log_deployment "Smoke tests passed for $slot"
}

switch_traffic() {
  local new_slot=$1
  local new_port=$(get_port_for_slot "$new_slot")
  
  echo -e "${BLUE}Switching traffic to $new_slot slot...${NC}"
  
  # Update load balancer configuration (nginx example)
  # This is environment-specific and depends on your infrastructure
  
  # For local testing, we just update the state file
  echo "$new_slot" > "$STATE_FILE"
  
  echo -e "${GREEN}✓ Traffic switched to $new_slot${NC}"
  log_deployment "Traffic switched to $new_slot"
}

verify_traffic_switch() {
  local slot=$1
  local port=$(get_port_for_slot "$slot")
  
  echo -e "${BLUE}Verifying traffic switch to $slot...${NC}"
  
  for i in {1..5}; do
    if ! curl -sf "http://localhost:${port}/" > /dev/null 2>&1; then
      echo -e "${RED}✗ Verification failed on attempt $i${NC}"
      log_deployment "Traffic verification failed for $slot"
      return 1
    fi
  done
  
  echo -e "${GREEN}✓ Traffic verification passed${NC}"
  log_deployment "Traffic verification passed for $slot"
}

rollback() {
  local previous_slot=$1
  local previous_port=$(get_port_for_slot "$previous_slot")
  
  echo -e "${YELLOW}Rolling back to $previous_slot slot...${NC}"
  
  # Update state file
  echo "$previous_slot" > "$STATE_FILE"
  
  # Verify rollback
  if curl -sf "http://localhost:${previous_port}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Rollback successful${NC}"
    log_deployment "Rollback successful to $previous_slot"
    return 0
  else
    echo -e "${RED}✗ Rollback verification failed${NC}"
    log_deployment "Rollback verification failed"
    return 1
  fi
}

cleanup_old_images() {
  echo -e "${BLUE}Cleaning up old Docker images...${NC}"
  
  docker image prune -f --filter "dangling=true" > /dev/null 2>&1 || true
  
  echo -e "${GREEN}✓ Cleanup completed${NC}"
}

generate_deployment_summary() {
  local active_slot=$(get_active_slot)
  local active_port=$(get_port_for_slot "$active_slot")
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Blue-Green Deployment Summary${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Environment: $ENVIRONMENT"
  echo "Active Slot: $active_slot (port $active_port)"
  echo "Deployment Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Status: SUCCESS"
  echo ""
  echo "Recent Deployment Log:"
  tail -10 "$DEPLOYMENT_LOG" | sed 's/^/  /'
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Blue-Green Deployment${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  local active_slot=$(get_active_slot)
  local deploy_slot=$(get_inactive_slot)
  
  echo "Current active slot: $active_slot"
  echo "Deploying to slot: $deploy_slot"
  echo ""
  
  # Build image
  build_image "$deploy_slot" || exit 1
  
  # Deploy to inactive slot
  deploy_to_slot "$deploy_slot" || exit 1
  
  # Wait for health
  wait_for_health "$deploy_slot" || {
    echo -e "${RED}Deployment failed, rolling back...${NC}"
    docker stop "fund-my-cause-$deploy_slot" 2>/dev/null || true
    exit 1
  }
  
  # Run smoke tests
  run_smoke_tests "$deploy_slot" || {
    echo -e "${RED}Smoke tests failed, rolling back...${NC}"
    docker stop "fund-my-cause-$deploy_slot" 2>/dev/null || true
    exit 1
  }
  
  # Switch traffic
  switch_traffic "$deploy_slot" || exit 1
  
  # Verify traffic switch
  verify_traffic_switch "$deploy_slot" || {
    echo -e "${RED}Traffic verification failed, rolling back...${NC}"
    rollback "$active_slot" || exit 1
    exit 1
  }
  
  # Cleanup
  cleanup_old_images
  
  # Generate summary
  generate_deployment_summary
}

main
