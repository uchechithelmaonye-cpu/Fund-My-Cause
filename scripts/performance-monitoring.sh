#!/usr/bin/env bash
# Performance monitoring and metrics collection
# Tracks performance metrics over time and generates alerts

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
METRICS_DIR="${METRICS_DIR:-.performance/metrics}"
ALERT_THRESHOLD_RESPONSE_TIME="${ALERT_THRESHOLD_RESPONSE_TIME:-500}"
ALERT_THRESHOLD_ERROR_RATE="${ALERT_THRESHOLD_ERROR_RATE:-5}"
COLLECTION_INTERVAL="${COLLECTION_INTERVAL:-60}"

mkdir -p "$METRICS_DIR"

collect_system_metrics() {
  echo -e "${BLUE}Collecting system metrics...${NC}"
  
  local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local metrics_file="$METRICS_DIR/system_$(date +%s).json"
  
  # CPU usage
  local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
  
  # Memory usage
  local mem_usage=$(free | grep Mem | awk '{printf("%.2f", ($3/$2) * 100)}')
  
  # Disk usage
  local disk_usage=$(df / | tail -1 | awk '{printf("%.2f", ($3/$2) * 100)}')
  
  # Load average
  local load_avg=$(uptime | awk -F'load average:' '{print $2}')
  
  cat > "$metrics_file" <<EOF
{
  "timestamp": "$timestamp",
  "cpu_usage_percent": $cpu_usage,
  "memory_usage_percent": $mem_usage,
  "disk_usage_percent": $disk_usage,
  "load_average": "$load_avg"
}
EOF
  
  echo -e "${GREEN}✓ System metrics collected${NC}"
  echo "  CPU: ${cpu_usage}%"
  echo "  Memory: ${mem_usage}%"
  echo "  Disk: ${disk_usage}%"
}

collect_application_metrics() {
  local target_url=$1
  
  echo -e "${BLUE}Collecting application metrics...${NC}"
  
  local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local metrics_file="$METRICS_DIR/app_$(date +%s).json"
  
  # Response time
  local response_time=$(curl -s -w "%{time_total}" -o /dev/null "$target_url/" 2>/dev/null || echo "0")
  response_time=$(echo "$response_time * 1000" | bc)
  
  # HTTP status
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$target_url/" 2>/dev/null || echo "000")
  
  # Check for errors
  local error_rate=0
  if [ "$http_code" != "200" ]; then
    error_rate=100
  fi
  
  cat > "$metrics_file" <<EOF
{
  "timestamp": "$timestamp",
  "response_time_ms": $response_time,
  "http_code": $http_code,
  "error_rate_percent": $error_rate
}
EOF
  
  echo -e "${GREEN}✓ Application metrics collected${NC}"
  echo "  Response time: ${response_time}ms"
  echo "  HTTP code: $http_code"
  echo "  Error rate: ${error_rate}%"
}

check_performance_alerts() {
  echo -e "${BLUE}Checking performance alerts...${NC}"
  echo ""
  
  local alerts_triggered=0
  
  # Check response time
  local latest_app_metric=$(ls -t "$METRICS_DIR"/app_*.json 2>/dev/null | head -1)
  if [ -n "$latest_app_metric" ]; then
    local response_time=$(jq -r '.response_time_ms' "$latest_app_metric")
    
    if (( $(echo "$response_time > $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) )); then
      echo -e "${RED}⚠ ALERT: High response time${NC}"
      echo "  Current: ${response_time}ms"
      echo "  Threshold: ${ALERT_THRESHOLD_RESPONSE_TIME}ms"
      ((alerts_triggered++))
    fi
  fi
  
  # Check error rate
  if [ -n "$latest_app_metric" ]; then
    local error_rate=$(jq -r '.error_rate_percent' "$latest_app_metric")
    
    if (( $(echo "$error_rate > $ALERT_THRESHOLD_ERROR_RATE" | bc -l) )); then
      echo -e "${RED}⚠ ALERT: High error rate${NC}"
      echo "  Current: ${error_rate}%"
      echo "  Threshold: ${ALERT_THRESHOLD_ERROR_RATE}%"
      ((alerts_triggered++))
    fi
  fi
  
  # Check system resources
  local latest_sys_metric=$(ls -t "$METRICS_DIR"/system_*.json 2>/dev/null | head -1)
  if [ -n "$latest_sys_metric" ]; then
    local cpu_usage=$(jq -r '.cpu_usage_percent' "$latest_sys_metric")
    local mem_usage=$(jq -r '.memory_usage_percent' "$latest_sys_metric")
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
      echo -e "${YELLOW}⚠ WARNING: High CPU usage${NC}"
      echo "  Current: ${cpu_usage}%"
      ((alerts_triggered++))
    fi
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
      echo -e "${YELLOW}⚠ WARNING: High memory usage${NC}"
      echo "  Current: ${mem_usage}%"
      ((alerts_triggered++))
    fi
  fi
  
  if [ "$alerts_triggered" -eq 0 ]; then
    echo -e "${GREEN}✓ No alerts triggered${NC}"
  fi
  
  echo ""
}

generate_metrics_report() {
  echo -e "${BLUE}Generating metrics report...${NC}"
  echo ""
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Performance Metrics Report${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  # System metrics summary
  echo "System Metrics (Last 10):"
  ls -t "$METRICS_DIR"/system_*.json 2>/dev/null | head -10 | while read file; do
    local timestamp=$(jq -r '.timestamp' "$file")
    local cpu=$(jq -r '.cpu_usage_percent' "$file")
    local mem=$(jq -r '.memory_usage_percent' "$file")
    echo "  $timestamp - CPU: ${cpu}% | Memory: ${mem}%"
  done
  echo ""
  
  # Application metrics summary
  echo "Application Metrics (Last 10):"
  ls -t "$METRICS_DIR"/app_*.json 2>/dev/null | head -10 | while read file; do
    local timestamp=$(jq -r '.timestamp' "$file")
    local response=$(jq -r '.response_time_ms' "$file")
    local code=$(jq -r '.http_code' "$file")
    echo "  $timestamp - Response: ${response}ms | HTTP: $code"
  done
  echo ""
  
  # Calculate averages
  echo "Performance Averages:"
  local avg_response=$(ls -t "$METRICS_DIR"/app_*.json 2>/dev/null | head -10 | \
    xargs jq -r '.response_time_ms' | awk '{sum+=$1; count++} END {if (count>0) printf("%.2f", sum/count)}')
  echo "  Average response time: ${avg_response}ms"
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

continuous_monitoring() {
  local target_url=$1
  
  echo -e "${BLUE}Starting continuous monitoring (Ctrl+C to stop)...${NC}"
  echo ""
  
  while true; do
    collect_system_metrics
    collect_application_metrics "$target_url"
    check_performance_alerts
    
    echo "Next collection in ${COLLECTION_INTERVAL}s..."
    sleep "$COLLECTION_INTERVAL"
  done
}

main() {
  local action="${1:-help}"
  local target_url="${2:-http://localhost:3000}"
  
  case "$action" in
    collect)
      collect_system_metrics
      collect_application_metrics "$target_url"
      ;;
    check)
      check_performance_alerts
      ;;
    report)
      generate_metrics_report
      ;;
    monitor)
      continuous_monitoring "$target_url"
      ;;
    *)
      echo -e "${BLUE}Performance Monitoring${NC}"
      echo ""
      echo "Usage: $0 <action> [target_url]"
      echo ""
      echo "Actions:"
      echo "  collect       Collect metrics once"
      echo "  check         Check for performance alerts"
      echo "  report        Generate metrics report"
      echo "  monitor       Continuous monitoring"
      echo ""
      echo "Examples:"
      echo "  $0 collect http://localhost:3000"
      echo "  $0 monitor http://staging.example.com"
      ;;
  esac
}

main "$@"
