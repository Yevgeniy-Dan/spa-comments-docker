FROM node:16

WORKDIR /server
COPY package*.json ./
RUN npm install --force
COPY . .
EXPOSE 6868
CMD [ "npm", "start" ]