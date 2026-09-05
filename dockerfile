FROM nginx:trixie
RUN rm -rf /usr/share/nginx/html/*
COPY dist/filmexa/browser/ /usr/share/nginx/html/
RUN rm -rf /etc/nginx/conf.d/*
COPY filmexa.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
