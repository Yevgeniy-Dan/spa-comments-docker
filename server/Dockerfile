# FROM node:16

# WORKDIR /app/server

# COPY ./server/package*.json ./

# RUN npm install

# COPY ./server .

# ENV CLIENT_ORIGIN=http://localhost:3000

# ENV DB_HOST=localhost
# ENV DB_NAME=spa-comments
# ENV DB_USER=root
# ENV DB_PASSWORD=dXVPWK6B7X0
# ENV DB_PORT=3307

# ENV AWS_API_VERSION=2012-10-17
# ENV AWS_ACCESS_KEY=AKIA2HRA2XHODTQLS2F7
# ENV AWS_SECRET_KEY=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
# ENV AWS_BUCKET=spacommentss3bucket

# ENV RECAPTCHA_SECRET_KEY=6Lc5UK0kAAAAAKlLssvzpHerM_GvP9jGdyi0EtXU

# CMD ["npm", "run", "server"]

# --------------------------------------------------

# FROM node:16

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 8080

# CMD [ "npm", "run", "server" ]

# --------------------------------------------------
FROM node:16

WORKDIR /server
COPY package*.json ./
RUN npm install
COPY . .

CMD [ "npm", "start" ]