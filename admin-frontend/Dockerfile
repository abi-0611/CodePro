FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

ENV PUBLIC_API_URL=http://api:8000
ENV MAIN_SITE_URL=http://main-site:3000
ENV CACHE_BUST_SECRET=codepro-cache-bust-secret-change-me

COPY . .
RUN rm -f .env .env.local .env.production && rm -rf .astro dist && npm run build

FROM node:22-slim AS runtime

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

ENV HOST=0.0.0.0
ENV PORT=4322

EXPOSE 4322

CMD ["node", "dist/server/entry.mjs"]
