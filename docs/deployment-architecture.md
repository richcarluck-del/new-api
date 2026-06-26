# 生产环境部署架构文档

## 一、服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | `150.109.68.117` |
| 系统 | Ubuntu |
| 用户 | `ubuntu` |
| SSH 密钥 | `C:\Users\张津豪\.ssh\hongkong.pem` |
| 站点 | https://shunfengai.cn |
| DNS / CDN | Cloudflare（代理模式，橙云） |

## 二、整体架构图

```
                          ┌─────────────────────────────────────┐
                          │         shunfengai.cn                │
                          │      Cloudflare (DNS 代理)            │
                          └─────────────┬───────────────────────┘
                                        │ 443/80
                                        ▼
                          ┌─────────────────────────────────────┐
                          │      宿主机 Nginx                      │
                          │   /etc/nginx/sites-available/        │
                          │       shunfengai.cn                  │
                          │   SSL 终结 + proxy_pass              │
                          │   127.0.0.1:3001                     │
                          └─────────────┬───────────────────────┘
                                        │ :3001
                                        ▼
                ┌───────────────────────────────────────────────────┐
                │              LB Nginx 容器 (new-api-lb)            │
                │            ~/new-api/lb-nginx.conf                │
                │              ip_hash 负载均衡                       │
                └──────┬────────────────────────┬───────────────────┘
                       │ :3000                  │ :3000
                       ▼                        ▼
          ┌──────────────────────┐  ┌──────────────────────┐
          │   new-api-1 (容器)    │  │   new-api-2 (容器)    │
          │   应用实例 1          │  │   应用实例 2          │
          └──────────┬───────────┘  └──────────┬───────────┘
                     │                         │
                     └─────────┬───────────────┘
                               │
                      ┌────────┴────────┐
                      │   Redis (缓存)   │
                      │ new-api-redis   │
                      └────────┬────────┘
                               │
                      ┌────────┴────────┐
                      │  PostgreSQL     │
                      │  10.5.0.7:5432  │
                      └─────────────────┘
```

## 三、组件说明

### 3.1 宿主机 Nginx

- **配置文件**：`/etc/nginx/sites-available/shunfengai.cn`
- **作用**：入口层，处理 HTTPS（SSL 终结），将请求反向代理到内部 LB
- **规则**：80/443 → `proxy_pass http://127.0.0.1:3001`
- **注意**：宿主机 Nginx **不 serve 静态文件**，纯代理转发

### 3.2 内部 LB Nginx（容器）

- **配置文件**：`~/new-api/lb-nginx.conf`
- **容器名**：`new-api-lb`
- **监听端口**：`3001`（来自宿主机 Nginx）
- **上游**：`new-api-1:3000` 和 `new-api-2:3000`
- **负载策略**：`ip_hash` —— 同一客户端 IP 始终打到同一实例

### 3.3 应用容器

- **容器名**：`new-api-1`、`new-api-2`
- **端口**：每个实例监听 `3000`
- **SESSION_SECRET**：两个实例必须保持一致，否则 401 错误

### 3.4 Docker Compose

- **配置文件**：`~/new-api/docker-compose.prod.yml`
- **包含服务**：
  - `new-api-1` / `new-api-2` — 应用实例
  - `new-api-lb` — 内部 Nginx 负载均衡
  - `new-api-redis` — Redis 缓存
  - `new-api-registry` — 本地 Docker Registry（`127.0.0.1:5000`）

### 3.5 数据库与缓存

| 服务 | 地址 | 认证 |
|------|------|------|
| PostgreSQL | `10.5.0.7:5432` | 用户 `newapi_user`，仅容器内可访问 |
| Redis | 容器内 `new-api-redis` | 密码见服务端配置文件 |

## 四、零停机部署流程

```
1. docker build -t 127.0.0.1:5000/new-api:latest .
2. docker push 127.0.0.1:5000/new-api:latest
3. docker compose -f ~/new-api/docker-compose.prod.yml up -d --no-recreate
   → 先替换 new-api-1，等待健康检查通过
   → 再替换 new-api-2
   → LB Nginx 自动感知，流量无中断
```

### 关键保证

- **ip_hash**：同一客户端始终打到同一实例，避免 Session 丢失
- **SESSION_SECRET 统一**：即使切换实例也能解密 Cookie
- **滚动替换**：两个实例不会同时重启，始终有一个在线

## 五、Cloudflare 配置

| 设置项 | 当前值 | 建议 |
|--------|--------|------|
| 安全级别 | `medium` | 正常，无需调整 |
| SSL/TLS | `full` | 正常 |
| Cache Level | `aggressive` | ⚠️ 建议改为 `Standard`，避免缓存 API 响应 |
| proxy_read_timeout | `100s` | ⚠️ 若 SSE 流式响应超过 100 秒会被断开 |
| Browser Integrity Check | `on` | 正常 |
| Always HTTPS | `off` | 建议开启 |
| Min TLS | `1.0` | 建议提升到 `1.2` |

### DNS 记录

3 条 A 记录全部指向 `150.109.68.117`，均已开启 Cloudflare 代理（橙云）。

## 六、注意事项

### 6.1 部署前

1. **开启 VPN**（如果需要）
2. 确认 `SESSION_SECRET` 在 `.env` 或 compose 文件中已配置且一致
3. 确保本地 Docker Registry 已运行（`new-api-registry`）

### 6.2 数据库操作

- 数据库只能在 **容器内** 访问（`10.5.0.7` 是内网地址）
- 执行 SQL 需要通过容器：
  ```bash
  docker exec -it new-api-1 <command>
  ```

### 6.3 主题切换

- 更新 `options` 表 `theme.frontend` 字段为 `"default"`
- 修改后需重启容器生效
- 宿主机 Nginx 是纯 `proxy_pass`，不 serve 静态文件，所以改主题配置在应用层即可

### 6.4 排查 401 问题

- 检查两个实例的 `SESSION_SECRET` 是否一致
- 确认 `ip_hash` 正常工作（同一客户端应始终打到同一实例）

### 6.5 SSH 连接

- 需要通过腾讯云堡垒机扫码验证
- 密钥路径：`C:\Users\张津豪\.ssh\hongkong.pem`
- 连接命令：
  ```bash
  ssh -i C:\Users\张津豪\.ssh\hongkong.pem ubuntu@150.109.68.117
  ```

## 七、常用操作命令

```bash
# 查看容器状态
docker compose -f ~/new-api/docker-compose.prod.yml ps

# 查看日志
docker logs -f new-api-1

# 重启单个实例（滚动，不影响服务）
docker compose -f ~/new-api/docker-compose.prod.yml up -d --no-deps --force-recreate new-api-1

# 进入容器
docker exec -it new-api-1 sh
```
