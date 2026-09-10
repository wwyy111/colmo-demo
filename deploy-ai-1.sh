#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/www/wwwroot/creaite.cn/COLMO/demo/ai-1
ROUTE_FILE=/etc/nginx/colmo-flow-locations.inc.conf
BACKUP_DIR=/root/colmo-ai-1-backups/$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"
cp -a "$ROUTE_FILE" "$BACKUP_DIR/colmo-flow-locations.inc.conf"
if [ -e "$APP_DIR" ]; then cp -a "$APP_DIR" "$BACKUP_DIR/ai-1"; fi
mkdir -p "$APP_DIR"
tar -xzf /tmp/colmo-ai-1-release.tar.gz -C "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} +
find "$APP_DIR" -type f -exec chmod 644 {} +
if ! grep -Fq 'location ^~ /COLMO/demo/ai-1/' "$ROUTE_FILE"; then
  cat /tmp/colmo-ai-1.conf >> "$ROUTE_FILE"
fi
if nginx -t; then
  nginx -s reload
else
  cp -a "$BACKUP_DIR/colmo-flow-locations.inc.conf" "$ROUTE_FILE"
  exit 1
fi
printf 'DEPLOYED %s\nBACKUP %s\n' "$APP_DIR" "$BACKUP_DIR"
