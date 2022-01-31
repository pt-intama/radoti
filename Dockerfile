FROM node:16.13-alpine AS development

WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install --production=false --ignore-platform

COPY . .

RUN yarn prisma generate
RUN yarn prisma migrate dev --name init
RUN yarn build

FROM node:16.13-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV SECURITY_JWT_ISSUER Radoti Server
ENV SECURITY_JWT_EXPIRE 15m
ENV SECURITY_RSA_BITLENGTH 2048
ENV SECURITY_RSA_PASSPHRASE your-passphrase

WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install --production=true --ignore-platform

COPY . .

COPY --from=development /usr/src/app/dist ./dist

VOLUME /usr/src/app/.radoti-auth /usr/src/app/storage /usr/src/app/migrations /usr/src/app/db

EXPOSE 8000

CMD ["node", "dist/main"]
