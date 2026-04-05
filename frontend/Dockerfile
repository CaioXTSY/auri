# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

# ---- Stage 2: Serve ----
FROM node:20-alpine AS production

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3010

CMD ["serve", "-s", "dist", "-p", "3010"]
