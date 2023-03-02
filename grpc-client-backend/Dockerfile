FROM node:16.19.0-alpine3.16 AS BUILD_IMAGE

ENV YARN_VERSION 1.22.18

RUN yarn policies set-version $YARN_VERSION

WORKDIR /usr/src/app

COPY package.json ./

# install dependencies
RUN yarn && yarn cache clean

COPY . .

FROM node:16.19.0-alpine3.16

WORKDIR /usr/src/app
ENV YARN_VERSION 1.22.18

RUN yarn policies set-version $YARN_VERSION

ENV NODE_ENV production
COPY --from=BUILD_IMAGE /usr/src/app/ ./

EXPOSE 3000
CMD [ "node","recieve.js"]