FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base
COPY --from=install /app/node_modules ./node_modules
COPY src ./src
COPY public ./public
COPY bunfig.toml tsconfig.json ./

ENV NODE_ENV=production
CMD ["bun", "src/index.ts"]
