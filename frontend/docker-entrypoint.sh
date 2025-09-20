#!/bin/sh

echo "Configuring frontend..."

# Replace the placeholder with the runtime API base URL
if [ ! -z "$API_BASE_URL" ]; then
    echo "Setting API base URL to: $API_BASE_URL"
    find /usr/share/caddy -name "*.js" -type f -exec sed -i "s|__API_BASE_URL_PLACEHOLDER__|$API_BASE_URL|g" {} \;
else
    echo "No API_BASE_URL provided, using default"
fi

echo "Starting Caddy..."
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
