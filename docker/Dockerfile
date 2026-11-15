FROM nginx:alpine3.23-slim

RUN rm -rf /usr/share/nginx/html/*

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/snello-layouts/browser/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
