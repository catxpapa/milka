#!/bin/sh

echo "启动喵卡 Milka 应用..."
echo "等待MySQL服务启动..."
wait_time=0
max_wait=180  # 最大等待2分钟
cd /lzcapp/pkg/content
while [ $wait_time -lt $max_wait ]; do
    # 使用nc (netcat) 检查MySQL端口是否可用
    if nc -z mysql.cloud.lazycat.app.milka.lzcapp 3306 2>/dev/null; then
        echo "MySQL端口已开放，等待服务完全启动..."
        sleep 5  # 端口开放后再等待5秒确保服务完全启动
        break
    fi
    
    echo "MySQL服务未就绪，等待中... (${wait_time}s/${max_wait}s)"
    sleep 3
    wait_time=$((wait_time + 3))
done

if [ $wait_time -ge $max_wait ]; then
    echo "错误：MySQL服务启动超时"
    exit 1
fi

echo "MySQL服务已就绪，启动Node.js应用..."


apk update
apk add nodejs npm
npm install
npm run start