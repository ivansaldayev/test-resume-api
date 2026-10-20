FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json prisma7.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
ENV NODE_ENV=production CHECKPOINT_DISABLE=1
WORKDIR /app
COPY --from=build /app/package.json /app/prisma7.config.ts ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY entrypoint.sh ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --start-interval=2s \
  CMD wget -q -O /dev/null --header 'apollo-require-preflight: true' "http://127.0.0.1:${PORT:-3000}/graphql?query=%7B__typename%7D" || exit 1
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main.js"]
