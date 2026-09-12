FROM nginx:trixie
RUN apt update && apt install -y python3-certbot-nginx && rm -rf /var/lib/apt/lists/*
RUN certbot --nginx -d filmexa.duckdns.org --email example@gmail.com --agree-tos --no-eff-email
RUN rm -rf /usr/share/nginx/html/*
COPY dist/filmexa/browser/ /usr/share/nginx/html/
RUN rm -rf /etc/nginx/conf.d/*
COPY filmexa.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
