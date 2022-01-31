FROM node:16.13-alpine as radoti

ENV SECURITY_JWT_ISSUER Radoti Server
ENV SECURITY_JWT_EXPIRE 15m
ENV SECURITY_RSA_BITLENGTH 2048
ENV SECURITY_RSA_PASSPHRASE your-passphrase

WORKDIR /usr/src/ap
COPY . .
RUN yarn install --production=true --ignore-platform

FROM radoti

RUN yarn prisma generate
RUN yarn prisma migrate dev --name init
RUN yarn nest build

VOLUME /usr/src/app/.radoti-auth /usr/src/app/storage /usr/src/app/migrations /usr/src/app/db

EXPOSE 8000

CMD ["node", "dist/main"]
