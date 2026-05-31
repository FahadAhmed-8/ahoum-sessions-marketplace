# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# --- Serve stage ---
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
# -s = SPA mode (fallback to index.html for client-side routing)
# bind to 0.0.0.0 so nginx (another container) can reach it, not just loopback
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3000"]
