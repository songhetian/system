# 部署指南

## 环境要求

- **Docker** 24+ 和 **Docker Compose** v2
- **Node.js** 22+ 和 **pnpm** 10+
- **Bash**（Windows 用户使用 Git Bash 或 WSL）

## 一键部署

```bash
pnpm deploy:all
```

脚本会自动完成：

1. 停止旧服务
2. 拉取基础镜像（MySQL、Redis、MinIO）
3. 安装项目依赖
4. 构建 TypeScript 后端
5. 构建 React 前端
6. 构建 Docker 镜像并启动所有服务
7. 等待 MySQL 就绪
8. 清空数据库并导入种子数据

## 访问地址

部署完成后访问：

| 地址 | 说明 |
|------|------|
| http://www.leixi.com | 系统首页 |
| http://localhost:3000/api/docs | API 文档 (Swagger) |
| http://localhost:9001 | MinIO 控制台 |

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |

## 服务架构

```
Client (Browser)
    │
    ▼
┌──────────────────┐
│  Nginx :80       │  反向代理 + 静态文件
│  www.leixi.com   │
└──────┬───────────┘
       │
       ├──── /api/* ────►  Server :3000 (API + DB + Redis)
       │                    │
       ├──── /ws ──────►    └── MySQL :3306
       │                    └── Redis :6379
       │
       ├──── /uploads/ ──► 静态文件目录
       │
       └──── /* ───────► 前端 SPA (Vite build)
```

## 环境变量

所有配置在项目根目录 `.env` 文件中：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DOMAIN | 域名 | www.leixi.com |
| MYSQL_USER | MySQL 用户 | shop |
| MYSQL_PASSWORD | MySQL 密码 | shop123456 |
| MYSQL_DATABASE | 数据库名 | shop_system |
| MYSQL_PORT | MySQL 端口 | 3307 |
| REDIS_PASSWORD | Redis 密码 | redis123456 |
| REDIS_PORT | Redis 端口 | 6379 |
| SERVER_PORT | API 端口 | 3000 |
| JWT_ACCESS_SECRET | JWT 密钥 | (修改为随机值) |
| MINIO_ACCESS_KEY | MinIO 用户 | minioadmin |
| MINIO_SECRET_KEY | MinIO 密码 | minioadmin |

## 手动操作

### 仅重置数据库

```bash
pnpm db:clear
```

### 仅启动基础设施（不启动前端后端）

```bash
pnpm docker:up
```

### 开发模式启动

```bash
pnpm dev
```

### 停止所有服务

```bash
docker compose down
```

### 停止并清除数据

```bash
docker compose down -v
```

## 生产环境建议

1. **修改默认密码** — 所有 `.env` 中的 `SECRET` 和 `PASSWORD` 值
2. **HTTPS** — 在 nginx 前加一层 HTTPS 反向代理（如 Caddy、Nginx + Let's Encrypt）
3. **备份** — 定期备份 MySQL volume (`mysql-data`)
4. **资源限制** — 在 `docker-compose.yml` 中为每个服务设置 `mem_limit` 和 `cpu_limit`
