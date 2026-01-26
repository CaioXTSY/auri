FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

EXPOSE 3001

# Iniciar aplicação
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
