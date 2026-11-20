# Bantay Cordova SPA — Vite build + Nginx static host / reverse proxy
# Build:  docker build -t bantay-cordova-frontend .
# Run:    docker run --rm -e API_ORIGIN=https://api.example.com -p 5173:80 bantay-cordova-frontend
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache gettext

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
