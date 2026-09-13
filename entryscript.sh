#!/bin/bash
set -e
docker exec filmexa-frontend certbot --nginx -d filmexa.duckdns.org --email example@gmail.com --agree-tos --no-eff-email
docker cp filmexassl.conf filmexa-frontend:/etc/nginx/conf.d/filmexa.conf
docker exec filmexa-frontend nginx -t
docker exec filmexa-frontend nginx -s reload