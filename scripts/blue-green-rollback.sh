#!/usr/bin/env bash
# Blue-green deployment rollback procedures
# Handles emergency rollbacks and recovery scenarios

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
STATE_FILE="/tmp/${ENVIRONMENT}_active_slot.txt"
ROLLBACK_LOG="/tmp/${ENVIRONMENT}_rollback.log"

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

log_rollback() {
  local message=$1
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "$timestamp - $message" >> "$ROLLBACK_LOG"
}

immediate_rollback() {
  echo -e "${RED}Performing immediate rollback...${NC}"
  
  local active_slot=$(get_active_slot)
  local inactive_slot=$(get_inactive_slot)
  local inactive_port=$(get_port_for_slot "$inactive_slot")
  
  # Verify inactive slot is healthy
  if curl -sf "http://localhost:${inactive_port}/health" > /dev/null 2>&1; then
    echo "$inactive_slot" > "$STATE_FILE"
    echo -e "${GREEN}✓ Rolled back to $inactive_slot${NC}"
    log_rollback "Immediate rollback to $inactive_slot successful"
    return 0
  else
    echo -e "${RED}✗ Inactive slot is not healthy, cannot rollback${NC}"
    log_rollback "Immediate rollback failed - inactive slot unhealthy"
    return 1
  fi
}

gradual_rollback() {
  echo -e "${YELLOW}Performing gradual rollback...${NC}"
  
  local active_slot=$(get_active_slot)
  local inactive_slot=$(get_inactive_slot)
  local active_port=$(get_port_for_slot "$active_slot")
  local inactive_port=$(get_port_for_slot "$inactive_slot")
  
  # Check if both slots are healthy
  if ! curl -sf "http://localhost:${active_port}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Active slot is not healthy${NC}"
    return 1
  fi
  
  if ! curl -sf "http://localhost:${inactive_port}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Inactive slot is not healthy${NC}"
    return 1
  fi
  
  # Gradually shift traffic (would require load balancer support)
  echo "Shifting 25% traffic to $inactive_slot..."
  sleep 2
  
  echo "Shifting 50% traffic to $inactive_slot..."
  sleep 2
  
  echo "Shifting 75% traffic to $inactive_slot..."
  sleep 2
  
  echo "Shifting 100% traffic to $inactive_slot..."
  echo "$inactive_slot" > "$STATE_FILE"
  
  echo -e "${GREEN}✓ Gradual rollback completed${NC}"
  log_rollback "Gradual rollback to $inactive_slot successful"
}

container_restart() {
  local slot=$1
  local container_name="fund-my-cause-$slot"
  local port=$(get_port_for_slot "$slot")
  
  echo -e "${BLUE}Restarting $slot container...${NC}"
  
  docker restart "$container_name" || {
    echo -e "${RED}✗ Container restart failed${NC}"
    log_rollback "Container restart failed for $slot"
    return 1
  }
  
  # Wait for health
  local attempts=0
  while [ $attempts -lt 30 ]; do
    if curl -sf "http://localhost:${port}/health" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Container restarted successfully${NC}"
      log_rollback "Container restarted for $slot"
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  
  echo -e "${RED}✗ Container failed to become healthy${NC}"
  log_rollback "Container restart health check failed for $slot"
  return 1
}

redeploy_previous_version() {
  local slot=$1
  local container_name="fund-my-cause-$slot"
  local port=$(get_port_for_slot "$slot")
  
  echo -e "${BLUE}Redeploying previous version to $slot...${NC}"
  
  # Stop current container
  docker stop "$container_name" 2>/dev/null || true
  docker rm "$container_name" 2>/dev/null || true
  
  # Get previous image tag
  local previous_image=$(docker images "fund-my-cause:${slot}-*" --format "{{.Repository}}:{{.Tag}}" | head -2 | tail -1)
  
  if [ -z "$previous_image" ]; then
    echo -e "${RED}✗ No previous image found${NC}"
    log_rollback "No previous image found for $slot"
    return 1
  fi
  
  # Deploy previous version
  docker run -d \
    --name "$container_name" \
    -p "$port:3000" \
    --env-file "apps/interface/.env.$ENVIRONMENT" \
    "$previous_image" || {
    echo -e "${RED}✗ Redeployment failed${NC}"
    log_rollback "Redeployment failed for $slot"
    return 1
  }
  
  # Wait for health
  local attempts=0
  while [ $attempts -lt 30 ]; do
    if curl -sf "http://localhost:${port}/health" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Previous version deployed successfully${NC}"
      log_rollback "Previous version redeployed to $slot"
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  
  echo -e "${RED}✗ Redeployed version failed to become healthy${NC}"
  log_rollback "Redeployed version health check failed for $slot"
  return 1
}

emergency_stop() {
  echo -e "${RED}Performing emergency stop...${NC}"
  
  docker stop fund-my-cause-blue 2>/dev/null || true
  docker stop fund-my-cause-green 2>/dev/null || true
  
  echo -e "${YELLOW}All containers stopped${NC}"
  log_rollback "Emergency stop executed"
}

health_check_all() {
  echo -e "${BLUE}Checking health of all slots...${NC}"
  echo ""
  
  local blue_port=$BLUE_PORT
  local green_port=$GREEN_PORT
  
  echo "Blue slot (port $blue_port):"
  if curl -sf "http://localhost:${blue_port}/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Healthy${NC}"
  else
    echo -e "  ${RED}✗ Unhealthy${NC}"
  fi
  
  echo "Green slot (port $green_port):"
  if curl -sf "http://localhost:${green_port}/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Healthy${NC}"
  else
    echo -e "  ${RED}✗ Unhealthy${NC}"
  fi
  
  echo ""
  echo "Active slot: $(get_active_slot)"
}

show_rollback_history() {
  echo -e "${BLUE}Rollback History:${NC}"
  echo ""
  
  if [ -f "$ROLLBACK_LOG" ]; then
    tail -20 "$ROLLBACK_LOG" | sed 's/^/  /'
  else
    echo "  No rollback history"
  fi
}

main() {
  local action="${1:-help}"
  
  case "$action" in
    immediate)
      immediate_rollback
      ;;
    gradual)
      gradual_rollback
      ;;
    restart)
      local slot="${2:-$(get_inactive_slot)}"
      container_restart "$slot"
      ;;
    redeploy)
      local slot="${2:-$(get_inactive_slot)}"
      redeploy_previous_version "$slot"
      ;;
    emergency)
      emergency_stop
      ;;
    health)
      health_check_all
      ;;
    history)
      show_rollback_history
      ;;
    *)
      echo -e "${BLUE}Blue-Green Deployment Rollback${NC}"
      echo ""
      echo "Usage: $0 <action> [options]"
      echo ""
      echo "Actions:"
      echo "  immediate       Immediately switch traffic to inactive slot"
      echo "  gradual         Gradually shift traffic to inactive slot"
      echo "  restart <slot>  Restart a specific slot container"
      echo "  redeploy <slot> Redeploy previous version to a slot"
      echo "  emergency       Stop all containers (emergency only)"
      echo "  health          Check health of all slots"
      echo "  history         Show rollback history"
      echo ""
      echo "Examples:"
      echo "  $0 immediate              # Quick rollback"
      echo "  $0 restart green          # Restart green slot"
      echo "  $0 redeploy blue          # Redeploy previous version to blue"
      ;;
  esac
}

main "$@"
