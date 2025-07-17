#!/bin/sh

echo "启动喵卡 Milka 应用..."

cd /lzcapp/pkg/content
apk update
apk add nodejs npm
npm install
npm run start