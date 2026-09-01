FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm i -g pnpm && pnpm i --frozen-lockfile || pnpm i
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json .
EXPOSE 3000
CMD ["node","node_modules/next/dist/bin/next","start","-p","3000"]
