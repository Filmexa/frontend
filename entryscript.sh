#!/bin/bash

if docker exec filmexa-frontend test -f /etc/letsencrypt/live/filmexa.duckdns.org/fullchain.pem && docker exec filmexa-frontend openssl x509 -in /etc/letsencrypt/live/filmexa.duckdns.org/fullchain.pem -checkend 0 -noout
then
    echo "Certificate exists and is not expired"
else
    docker exec filmexa-frontend certbot --nginx -d filmexa.duckdns.org --email example@gmail.com --agree-tos --no-eff-email
fi

docker cp filmexassl.conf filmexa-frontend:/etc/nginx/conf.d/filmexa.conf
docker exec filmexa-frontend nginx -s reload