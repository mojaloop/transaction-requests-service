# Arguments
ARG NODE_VERSION="24.21.0-alpine3.24"
# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine" \
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t mojaloop/sdk-scheme-adapter:local \
#    . \
#

# Build Image
FROM node:${NODE_VERSION} AS builder
WORKDIR /opt/app

RUN apk --no-cache add git
RUN apk add --no-cache --virtual .build-deps autoconf automake bash g++ gcc libtool make openssl-dev python3

COPY package.json package-lock.json* /opt/app/

# Lifecycle scripts are skipped for supply-chain safety (docker:S6505); no production
# dependency in this service needs a native build.
RUN npm ci --omit=dev --ignore-scripts

COPY src /opt/app/src
COPY config /opt/app/config
COPY test /opt/app/test

FROM node:${NODE_VERSION}
WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D ml-user 
USER ml-user

COPY --chown=ml-user --from=builder /opt/app .

EXPOSE 4001
CMD ["npm", "run", "start"]
