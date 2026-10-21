# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# O Coolify usa o repo inteiro como build context
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Força instalação de devDependencies no build (NODE_ENV pode ser production no Coolify)
RUN npm ci --include=dev

RUN npx prisma generate

COPY backend/ .

RUN npm run build
RUN npm run build:runner

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-runner ./dist-runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

ENV UPLOAD_DIR=/app/uploads
ENV PRIVATE_UPLOAD_DIR=/app/private-uploads

RUN mkdir -p /app/uploads/avatars /app/private-uploads/activity-submissions

VOLUME ["/app/uploads", "/app/private-uploads"]

EXPOSE 3001

CMD ["node", "dist/main"]

# ---- Stage 3: Runner ----
FROM production AS runner

RUN apk add --no-cache docker-cli

CMD ["node", "dist-runner/worker/code-runner.worker.js"]
