# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# O Coolify usa o repo inteiro como build context,
# entao copiamos apenas a pasta backend/
COPY backend/ .

RUN npm install

RUN npx prisma generate

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

COPY backend/ .

RUN npm install --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npx prisma generate

RUN mkdir -p uploads

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
