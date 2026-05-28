#!/bin/bash
# ===================================
# 记账小程序后端部署脚本
# 服务器: 腾讯云 101.35.250.154 (ubuntu)
# 域名: fini.wuflux.cn
# ===================================

set -e

APP_DIR="/opt/bookkeeper"
REPO_URL="https://github.com/wanhuhou1983/bookkeeper.git"
PORT=8900
SERVICE_NAME="bookkeeper"
DOMAIN="fini.wuflux.cn"

echo "=== 1. 安装系统依赖 ==="
sudo apt-get update -qq
sudo apt-get install -y -qq nginx python3 python3-pip python3-venv postgresql postgresql-client curl git

echo "=== 2. 拉取最新代码 ==="
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    sudo git pull origin master
else
    sudo git clone "$REPO_URL" "$APP_DIR"
    sudo chown -R ubuntu:ubuntu "$APP_DIR"
    cd "$APP_DIR"
fi

echo "=== 3. 安装 Python 依赖 ==="
cd "$APP_DIR/backend"
pip3 install -r requirements.txt --quiet 2>/dev/null || pip3 install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] httpx pydantic --quiet

echo "=== 4. 配置 PostgreSQL ==="
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='bookkeeper'" 2>/dev/null | grep -q 1 || sudo -u postgres createdb bookkeeper
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'linhu50115';" 2>/dev/null

echo "=== 5. 配置环境变量 ==="
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:linhu50115@localhost:5432/bookkeeper
SECRET_KEY=pdum-WWpTdZeZgESxZOYLqK97ve38NNwRulQg2sbNjg
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
CORS_ORIGINS=*
WX_APPID=wx8cff51c9cc738ab0
WX_SECRET=645d3e1a880feebf25270c2fdad99f10
ENVEOF

echo "=== 6. 数据库迁移 ==="
python3 -c "
from app.database import engine, Base
from app.models import *  # 导入所有模型
Base.metadata.create_all(bind=engine)
print('Tables created successfully')
"

echo "=== 7. 创建 systemd 服务 ==="
sudo cat > /etc/systemd/system/${SERVICE_NAME}.service << SERVICEEOF
[Unit]
Description=Bookkeeper FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${APP_DIR}/backend
ExecStart=python3 -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SERVICEEOF

echo "=== 8. 配置 Nginx ==="
sudo cat > /etc/nginx/sites-available/bookkeeper << 'NGINXEOF'
server {
    listen 80;
    server_name fini.wuflux.cn;

    # 静态文件
    location / {
        root /opt/bookkeeper/backend/static;
        index index.html;
        try_files $uri /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8900;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Web 静态资源
    location /static/ {
        alias /opt/bookkeeper/backend/static/;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/bookkeeper /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "=== 9. 启动服务 ==="
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

echo "=== 10. 检查状态 ==="
sleep 3
sudo systemctl status $SERVICE_NAME --no-pager | head -10
echo ""
echo "Health check:"
curl -s http://localhost:${PORT}/health || echo "WARNING: health check failed"
echo ""
echo "Nginx check:"
curl -s http://localhost/api/v1/accounts -H "Authorization: Bearer test" || echo "(expected 401 - nginx proxy works)"
echo ""
echo "=== 部署完成 ==="
echo "后端: http://localhost:${PORT}"
echo "API:  https://${DOMAIN}/api/v1/"
echo "管理: https://${DOMAIN}/"
echo ""
echo "查看日志: sudo journalctl -u ${SERVICE_NAME} -f"
echo "重启服务: sudo systemctl restart ${SERVICE_NAME}"