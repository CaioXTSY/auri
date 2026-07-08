# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# O Coolify usa o repo inteiro como build context
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Força instalação de devDependencies no build (NODE_ENV pode ser production no Coolify)
RUN npm install --include=dev

RUN npx prisma generate

COPY backend/ .

RUN npm run build
RUN npm run build:runner

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

RUN apk add --no-cache openssl docker-cli

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-runner ./dist-runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["node", "dist/main"]
