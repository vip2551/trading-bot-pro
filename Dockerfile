# Trading Bot Pro - Railway Deployment
# Force rebuild by changing this comment: v4-final

FROM node:22-alpine

WORKDIR /app

# Install bun
RUN npm install -g bun

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy package files
COPY package.json bun.lock* ./

# Install all dependencies
RUN bun install

# Copy prisma schema and generate
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy all source files
COPY src ./src
COPY public ./public
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY tsconfig.json ./
COPY components.json ./
COPY tailwind.config.ts ./
COPY eslint.config.mjs ./

# Build Next.js
RUN bun run build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# Start command - MUST use 0.0.0.0
CMD ["sh", "-c", "bunx prisma db push --skip-generate 2>/dev/null; exec bun x next start -H 0.0.0.0 -p 3000"]
