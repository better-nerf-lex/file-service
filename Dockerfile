FROM node:22-slim AS builder

# Install dependencies for node-canvas
RUN apt-get update && apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  curl \
  bash \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  libcairo2 \
  libpango-1.0-0 \
  libjpeg62-turbo \
  libgif7 \
  librsvg2-2 \
  curl \
  bash \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./

RUN mkdir -p /data && chmod 777 /data
ENV NODE_ENV=production

RUN printf '%s\n' \
  '#!/bin/bash' \
  'echo "Starting service"' \
  'node dist/main.js' \
  > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
