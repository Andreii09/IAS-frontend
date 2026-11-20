#!/bin/sh
set -e

PORT="${PORT:-80}"
export PORT

if [ -z "$API_ORIGIN" ]; then
    echo "ERROR: API_ORIGIN must be set to the backend origin, e.g. https://api.example.com" >&2
    exit 1
fi

# Only substitute our own variables; leave Nginx's $uri/$host variables intact.
envsubst '${PORT} ${API_ORIGIN}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

echo "Serving Bantay Cordova SPA on port ${PORT}; API -> ${API_ORIGIN}"
exec nginx -g "daemon off;"
