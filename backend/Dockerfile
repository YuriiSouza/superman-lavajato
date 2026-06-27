FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl procps && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

FROM deps AS dev
COPY . .
CMD ["npm", "run", "start:dev"]

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD sh -c "npx prisma migrate deploy && node dist/main"
