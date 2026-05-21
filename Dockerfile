FROM node:18-alpine AS util

WORKDIR /src

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=util /src/build /usr/share/nginx/html

COPY --from=util /src/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


