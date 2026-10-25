FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3500 YAHO_PREWARM=false
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3500
CMD ["node", "server.js"]
