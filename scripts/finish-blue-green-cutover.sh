#!/usr/bin/env bash
# Finish cutover when idle slot container is already built and running.
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/opt/mycodao}"
STATE_DIR="${STATE_DIR:-/opt/mycodao/state}"
NGINX_DIR="${NGINX_DIR:-/opt/mycodao/nginx}"
IDLE="${1:-green}"
ACTIVE="${2:-blue}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
HEALTH_STREAK="${HEALTH_STREAK:-3}"
ROLLBACK_WINDOW="${ROLLBACK_WINDOW:-30}"

cd "$DEPLOY_DIR"
mkdir -p "$STATE_DIR" "$NGINX_DIR/conf.d"

if [[ -f "${DEPLOY_ENV_FILE:-/opt/mycodao/deploy.env}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${DEPLOY_ENV_FILE:-/opt/mycodao/deploy.env}"
  set +a
fi

CF_ZONE_ID="${CF_ZONE_ID:-${CLOUDFLARE_ZONE_ID:-}}"
CF_API_TOKEN="${CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"

cp deploy/nginx/nginx.conf "$NGINX_DIR/nginx.conf"
sed "s|__ACTIVE_SLOT__|${IDLE}|g" deploy/nginx/conf.d/blocks.conf.template > "$NGINX_DIR/conf.d/blocks.conf"

cid="mycodao-${IDLE}"
streak=0
deadline=$(( $(date +%s) + 120 ))
while (( $(date +%s) < deadline )); do
  if docker exec "$cid" node -e \
    "require('http').get('http://127.0.0.1:3004${HEALTH_PATH}',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" \
    >/dev/null 2>&1; then
    streak=$((streak + 1))
    (( streak >= HEALTH_STREAK )) && break
  else
    streak=0
  fi
  sleep 3
done
(( streak >= HEALTH_STREAK )) || { echo "ERR: $cid unhealthy"; docker logs --tail 40 "$cid"; exit 1; }

docker exec mycodao-proxy nginx -t
docker exec mycodao-proxy nginx -s reload
echo "$IDLE" > "$STATE_DIR/active-slot"

if [[ -n "$CF_ZONE_ID" && -n "$CF_API_TOKEN" ]]; then
  curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"purge_everything":true}' | grep -q '"success":true' && echo "OK: Cloudflare purged"
fi

sleep "$ROLLBACK_WINDOW"
docker stop -t 20 "mycodao-${ACTIVE}" 2>/dev/null || true
docker rm -f "mycodao-${ACTIVE}" 2>/dev/null || true
echo "OK: cutover complete active=${IDLE}"
