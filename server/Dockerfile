FROM node:16-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

FROM node:16-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json .sequelizerc db.config.js ./
COPY migrations ./migrations
COPY seeders ./seeders
USER node
EXPOSE 5000
CMD ["sh", "-c", "node_modules/.bin/sequelize-cli db:migrate && node dist/server.js"]
