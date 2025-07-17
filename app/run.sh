#!/bin/bash

echo "启动喵卡 Milka 应用..."

# 设置工作目录
cd /lzcapp/pkg/content

# 等待MySQL服务启动
echo "等待MySQL服务启动..."
sleep 5

# 启动Node.js应用
echo "启动Node.js服务器..."
npm start