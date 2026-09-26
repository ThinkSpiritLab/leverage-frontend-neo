# Build the Nuxt SPA and its Nitro HTML/runtime output.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g pnpm@10.30.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ssr:false still needs Nitro to serve its SPA document and server routes.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV HOST=0.0.0.0 PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
