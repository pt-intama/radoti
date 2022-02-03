FROM node:16.13-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn

COPY . .

RUN yarn setup
RUN yarn add @prisma/client
RUN yarn build

ENV SERVER_MODE development
ENV SECURITY_JWT_ISSUER Radoti Server
ENV SECURITY_JWT_EXPIRE 15m
ENV SECURITY_RSA_BITLENGTH 2048
ENV SECURITY_RSA_PASSPHRASE your-passphrase

VOLUME /usr/src/app/.radoti-auth /usr/src/app/storage /usr/src/app/migrations /usr/src/app/db

EXPOSE 8800

CMD ["node", "dist/main"]
