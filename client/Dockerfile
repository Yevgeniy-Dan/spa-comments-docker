FROM node:16 as build-stage

WORKDIR /client
COPY package.json .
RUN npm install --force
COPY . .

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ARG REACT_APP_RECAPTCHA_SITEKEY
ENV REACT_APP_RECAPTCHA_SITEKEY=$REACT_APP_RECAPTCHA_SITEKEY

RUN npm run build

FROM nginx:1.17.0-alpine

COPY --from=build-stage /client/build /usr/share/nginx/html
EXPOSE $REACT_DOCKER_PORT

CMD nginx -g 'daemon off;'