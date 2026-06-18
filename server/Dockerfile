FROM node:20-alpine

WORKDIR /app

# Prisma needs OpenSSL on Alpine/musl to run its query + schema engines.
RUN apk add --no-cache openssl

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Prisma needs the schema present to generate the client
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4000

# On boot: apply migrations, seed (idempotent), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
