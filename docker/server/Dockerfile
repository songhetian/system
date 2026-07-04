FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile --config.strictDepBuilds=false

COPY shared/src ./shared/src
COPY server/prisma ./server/prisma

WORKDIR /app/server
RUN pnpm prisma generate

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma

COPY pnpm-workspace.yaml package.json ./
COPY server/package.json ./server/
COPY server/dist ./server/dist

WORKDIR /app/server

RUN mkdir -p /app/server/uploads

EXPOSE 3000

CMD ["node", "dist/index.js"]