FROM node:24-alpine

RUN apk upgrade --no-cache && \
    apk update --no-cache && \
    apk add --no-cache openssl

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install
RUN npx prisma generate
RUN npm run build

CMD ["npm", "run", "dev"]