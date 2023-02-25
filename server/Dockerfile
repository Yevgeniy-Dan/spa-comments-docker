FROM node:16

WORKDIR /server
COPY package.json .
RUN npm install --force
COPY . .
CMD [ "npm", "start" ]