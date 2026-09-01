# Imagen del front de SmartBuy: build de Angular + nginx sirviendo la SPA.
# nginx además proxya /api hacia el contenedor de la API (misma red de compose),
# cumpliendo el rol que en desarrollo hace el proxy de ng serve.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/smartbuy-ui/browser /usr/share/nginx/html
EXPOSE 80
