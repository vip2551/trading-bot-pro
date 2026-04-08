FROM node:22-alpine

WORKDIR /app

# Install bun
RUN npm install -g bun

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy all files
COPY . .

# Install dependencies
RUN bun install --ignore-scripts

# Generate Prisma Client
RUN bunx prisma generate

# Build the app
RUN bun run build

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/trading.db"

EXPOSE 3000

# Start the app
CMD ["sh", "-c", "bunx prisma db push --skip-generate && bunx next start -H 0.0.0.0 -p 3000"]
