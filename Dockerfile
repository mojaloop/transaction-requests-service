FROM node:10.15.3-alpine

WORKDIR /opt/transaction-requests-service

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/transaction-requests-service/
RUN npm install --production

RUN apk del build-dependencies

COPY config /opt/transaction-requests-service/config
COPY src /opt/transaction-requests-service/src

EXPOSE 4001
CMD ["npm", "run", "start"]
