FROM node:lts AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /site
COPY ./Caddyfile /etc/caddy/Caddyfile
