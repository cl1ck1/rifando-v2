FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-spec/package.json lib/api-spec/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/db/package.json lib/db/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/rifeiro-app/package.json artifacts/rifeiro-app/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=deps /app/artifacts/rifeiro-app/node_modules ./artifacts/rifeiro-app/node_modules
COPY --from=deps /app/lib/*/node_modules ./lib/
COPY . .
RUN pnpm run build

# Production api-server — use same base to preserve symlinks
FROM node:22-slim AS api-server
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=build /app/artifacts/api-server/dist ./dist
# Resolve pnpm symlinks by reinstalling with hoisted mode
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/lib/db/package.json ./lib/db/package.json
COPY --from=build /app/lib/api-zod/package.json ./lib/api-zod/package.json
COPY --from=build /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=build /app/artifacts/rifeiro-app/package.json ./artifacts/rifeiro-app/package.json
RUN echo 'node-linker=hoisted' > .npmrc && pnpm install --frozen-lockfile --prod

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.mjs"]

# Production rifeiro-app (nginx)
FROM nginx:alpine AS rifeiro-app
COPY --from=build /app/artifacts/rifeiro-app/dist/public /usr/share/nginx/html
COPY artifacts/rifeiro-app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
