FROM node:16.13-alpine

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND yarn.lock are copied
COPY package.json ./
COPY yarn.lock ./
COPY prisma ./prisma/

# Install app dependencies
RUN yarn

COPY . .

RUN yarn setup

FROM node:16.13-alpine

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

ENV SERVER_MODE development
ENV SECURITY_JWT_ISSUER Radoti Server
ENV SECURITY_JWT_EXPIRE 15m
ENV SECURITY_RSA_BITLENGTH 2048
ENV SECURITY_RSA_PASSPHRASE your-passphrase

VOLUME /usr/src/app/.radoti-auth /usr/src/app/storage /usr/src/app/migrations /usr/src/app/db

EXPOSE 8800

CMD ["node", "dist/main"]
