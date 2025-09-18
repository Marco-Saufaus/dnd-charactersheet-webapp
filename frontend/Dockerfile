
#############################
# Stage 1: Build the frontend
#############################
FROM node:20-alpine AS build

WORKDIR /app

# Install deps (need devDependencies for Vite build)
COPY package*.json ./
# No lockfile present; use install (will generate a lock inside image only)
RUN npm install

# Copy rest of source
COPY . .

# Build (produces /app/dist)
RUN npm run build

#############################
# Stage 2: Runtime (static serving)
#############################
FROM caddy:2-alpine AS runtime

# Copy compiled assets only
COPY --from=build /app/dist /usr/share/caddy

# Copy the runtime configuration script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use custom entrypoint for runtime configuration
ENTRYPOINT ["/docker-entrypoint.sh"]