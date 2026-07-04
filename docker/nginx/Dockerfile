FROM nginx:alpine

RUN apk add --no-cache gettext

COPY web/dist /usr/share/nginx/html
COPY docker/nginx/default.conf.template /etc/nginx/conf.d/default.conf.template

CMD ["/bin/sh", "-c", "envsubst '$$DOMAIN' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
