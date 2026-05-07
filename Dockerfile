# Multi-stage Dockerfile for Nettside-Mal (Separate Frontend + Backend)

# Stage 1: Bygg frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Kopier pakkefiler først for bedre caching
COPY package*.json ./

# Installer avhengigheter
RUN npm ci

# Kopier kildefiler
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY eslint.config.js ./

# Bygg
RUN npm run build

# Stage 2: Frontend produksjonsstadium
FROM nginx:alpine AS frontend

# Kopier bygd frontend fra build stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Kopier nginx konfigurasjon
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eksponer port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Backend produksjonsstadium
FROM node:22-alpine AS backend

WORKDIR /app

# Kopier backend pakkefiler først for bedre caching
COPY server/package*.json ./server/

# Installer backend avhengigheter
RUN cd server && npm ci --only=production

# Kopier backend kildefiler
COPY server/db.js ./server/
COPY server/index.js ./server/

# Kopier rot package.json for skripter
COPY package*.json ./

# Eksponer port
EXPOSE 6767

# Start backend applikasjonen direkte med Node.js
CMD ["node", "server/index.js"]
