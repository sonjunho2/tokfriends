FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm i -g pnpm && pnpm i --frozen-lockfile || pnpm i
COPY . .
RUN pnpm prisma generate && pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json .
EXPOSE 4000
CMD ["node","dist/src/main.js"]
