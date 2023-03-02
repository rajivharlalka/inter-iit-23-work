FROM node:14-alpine3.14 AS BUILD_IMAGE

ENV YARN_VERSION 1.22.18

RUN yarn policies set-version $YARN_VERSION

WORKDIR /usr/src/app

COPY package.json ./

# install dependencies
RUN yarn && yarn cache clean

COPY . .

FROM node:14-alpine3.14

WORKDIR /usr/src/app

ENV NODE_ENV development
COPY --from=BUILD_IMAGE /usr/src/app/ ./
ENV PORT 8080

EXPOSE 8080/tcp
CMD [ "node","index.js" ]