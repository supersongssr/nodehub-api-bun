# NodeHub API管理中心

> 基于 Bun.js 构建的现代化节点管理与配置分发系统

## 项目简介

NodeHub API 是一个集中式的节点管理服务中心，采用 `Node -> NodeHub API -> 前端面板` 的通信模式。系统负责：

- 管理多台 VPS 主机的硬件信息、流量统计和运行状态
- 统一管理代理节点的配置、域名分配和 DNS 解析
- 支持多面板集成（SSP、SRP）和配置文件下发
- 提供 RESTful API 供节点和面板进行交互

## 技术栈

### 核心框架
- **运行时**: [Bun](https://bun.sh/) - 高性能 JavaScript 运行时，内置 TypeScript 支持
- **Web 框架**: [Elysia](https://elysiajs.com/) - 专为 Bun 优化的现代化 Web 框架
  - 类型安全的 API 路由
  - 优秀的中间件支持
  - 高性能的请求处理

### 数据层
- **数据库**: SQLite3
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
  - 类型安全的数据库操作
  - 支持迁移管理
  - 零开销的查询构建器

### 配置管理
- **主配置**: TOML 格式（Bun 原生支持）
- **环境变量**: `.env` 文件（通过 `bun` 内置支持）
- **静态配置**: JSON 格式（用于模板等场景）

### 后台任务
- **任务调度**: [PQueue](https://github.com/sindresorhus/pqueue)
  - 内存队列管理
  - 并发控制和优先级支持
  - 适用于 DNS 后台任务

### 部署
- **进程管理**: systemd
- **容器化**: podman（可选）

## 项目目录结构

```
nodehub-api-bun/
├── src/
│   ├── index.ts              # 应用入口
│   ├── config/               # 配置管理
│   │   ├── load.ts          # 配置加载器（TOML/ENV）
│   │   └── schema.ts        # 配置类型定义
│   │
│   ├── modules/             # 业务模块
│   │   ├── host/           # 主机管理模块
│   │   │   ├── routes.ts   # API 路由
│   │   │   ├── service.ts  # 业务逻辑
│   │   │   └── model.ts    # 数据模型
│   │   │
│   │   ├── node/           # 节点管理模块
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   └── model.ts
│   │   │
│   │   ├── config/         # 配置下发模块
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   └── templates/  # 配置模板
│   │   │       ├── xray.json
│   │   │       └── nginx.conf
│   │   │
│   │   ├── dns/            # DNS 管理模块
│   │   │   ├── worker.ts   # 后台任务
│   │   │   ├── service.ts
│   │   │   └── providers/  # DNS 服务商适配器
│   │   │
│   │   └── panel/          # 面板集成模块
│   │       ├── ssp.ts      # SSP 面板适配器
│   │       └── srp.ts      # SRP 面板适配器
│   │
│   ├── db/                 # 数据库层
│   │   ├── schema.ts       # Drizzle Schema 定义
│   │   ├── migrate.ts      # 迁移脚本
│   │   └── connection.ts   # 数据库连接
│   │
│   ├── workers/            # 后台任务
│   │   ├── dns.ts         # DNS 任务队列
│   │   └── monitor.ts     # 监控任务
│   │
│   ├── utils/              # 工具函数
│   │   ├── logger.ts      # 日志工具
│   │   ├── notify.ts      # Telegram 通知
│   │   └── validator.ts   # 数据验证
│   │
│   └── types/              # TypeScript 类型定义
│       └── index.ts
│
├── config/                 # 配置文件目录
│   ├── config.toml        # 主配置文件
│   ├── .env.example       # 环境变量示例
│   └── panels/            # 面板配置
│       ├── ssp.toml
│       └── srp.toml
│
├── configs/               # 配置模板（已有）
│   ├── xray/
│   │   └── xray.json
│   └── nginx/
│       └── nginx.json
│
├── drizzle/               # 数据库迁移
│   └── schema.ts
│
├── tests/                 # 测试文件
│   ├── host.test.ts
│   ├── node.test.ts
│   └── dns.test.ts
│
├── package.json
├── tsconfig.json
├── bun.lockb
└── README.md
```

## 系统架构

### 通信流程

```
┌─────────┐     API      ┌─────────────┐     API      ┌──────────┐
│  Node   │ <--------->  │ NodeHub API │ <--------->  │  Panel   │
│ (VPS)   │             │   (本系统)    │             │ (SSP/SRP)│
└─────────┘             └─────────────┘             └──────────┘
    │                         │                           │
    │                         │                           │
    ├─ 上报主机信息           ├─ 获取节点配置            ├─ 同步节点信息
    ├─ 请求配置文件           ├─ 下发代理配置            ├─ 管理用户订阅
    └─ 心跳检测               ├─ 域名分配                └─ 流量统计
                             └─ DNS 解析
```

### 模块设计

#### API 模块（对外接口）

1. **Host 模块** (`src/modules/host/`)
   - 服务器信息管理
   - 记录 VPS 硬件配置、流量统计、运行状态
   - IP 变动监控和通知
   - 月度流量计算和报警

2. **Node 模块** (`src/modules/node/`)
   - 节点信息管理
   - 支持多节点部署，记录节点配置、分组、等级
   - 节点参数分配和 ID 管理
   - 域名自动分配和 DNS 解析

3. **Config 模块** (`src/modules/config/`)
   - 配置文件下发
   - 支持 Xray、Nginx 等配置模板
   - 根据节点信息动态生成配置

#### 后台模块（内部服务）

4. **DNS Worker 模块** (`src/modules/dns/` + `src/workers/`)
   - 后台 DNS 解析任务处理
   - 使用 PQueue 管理异步任务
   - 域名解析记录查询和更新
   - 域名过期监控和通知

5. **Panel 集成模块** (`src/modules/panel/`)
   - SSP 面板 API 对接
   - SRP 面板 API 对接
   - 节点信息同步
   - 用户订阅管理

6. **Log & Notify 模块** (`src/utils/`)
   - 结构化日志记录
   - Telegram 错误通知
   - 操作审计日志

## 数据结构

系统使用 TOML 格式存储配置数据，主要包含以下结构：

### Host（主机信息）
- name, alias, provider, type
- cpu, uptime, memory, disk
- net.data.limit, net.data.used, net.card, net.ip, net.ipv6
- net.location, net.media.support

### Node（节点信息）
- hub.url, hub.api
- panel.name, panel.id, panel.ids
- group, level, ports.public, ports.private
- proxy.name, proxy.path
- domain, alias, name

### Config（系统配置）
- panels.ssp/srp.api/db
- domains.dns.records
- notify.telegram

## API 文档

### 基础信息

- **Base URL**: `http://your-host:port`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token  

### Host 模块 API

#### POST /api/host/add
上报或更新主机信息

**请求体**:
```json
{
  "name": "host-01",
  "alias": "香港 VPS 01",
  "provider": "BandwagonHost",
  "type": "KVM",
  "cpu": 1,
  "uptime": 86400,
  "memory": {
    "total": { "mb": 1024, "gb": 1 },
    "used": { "mb": 512, "gb": 0.5 }
  },
  "disk": {
    "total": { "gb": 100 },
    "used": { "gb": 20 }
  },
  "net": {
    "card": "eth0",
    "ip": "1.2.3.4",
    "ipv6": "2001:db8::1",
    "location": {
      "region": "Hong Kong",
      "country": { "name": "China", "code": "CN" }
    }
  }
}
```

**响应**: `200 OK`
```json
{
  "success": true,
  "message": "Host information updated"
}
```

#### POST /api/host/status
更新主机运行状态

**请求体**:
```json
{
  "name": "host-01",
  "uptime": 172800,
  "memory": { "total": { "mb": 1024 }, "used": { "mb": 600 } },
  "net": {
    "data": {
      "used": {
        "monthly": {
          "rx": { "bytes": 1073741824, "gb": 1 },
          "tx": { "bytes": 536870912, "gb": 0.5 }
        }
      }
    }
  }
}
```

### Node 模块 API

#### POST /api/node/register
注册或更新节点

**请求体**:
```json
{
  "name": "node-hk-01",
  "host": "host-01",
  "panel": {
    "name": "ssp",
    "id": 123
  },
  "group": 3,
  "level": 1,
  "ports": {
    "public": [12345, 14456],
    "private": [12363]
  },
  "proxy": {
    "name": "vless-grpc",
    "serviceName": "grpc-service"
  }
}
```

**响应**: `200 OK`
```json
{
  "success": true,
  "data": {
    "name": "node-hk-01",
    "domain": "hk01.example.com",
    "id": 123,
    "config": {
      "port": 12345,
      "tls": true
    }
  }
}
```

#### GET /api/node/{name}
获取节点配置信息

**响应**: `200 OK`
```json
{
  "name": "node-hk-01",
  "domain": "hk01.example.com",
  "ports": { "public": [12345], "private": [12363] },
  "proxy": {
    "name": "vless-grpc",
    "serviceName": "grpc-service"
  }
}
```

### Config 模块 API

#### GET /api/config/{nodeName}/xray
获取节点的 Xray 配置文件

**响应**: `200 OK`
```json
{
  "inbounds": [...],
  "outbounds": [...]
}
```

#### GET /api/config/{nodeName}/nginx
获取节点的 Nginx 配置文件

**响应**: `200 OK`
```text
server {
    listen 443 ssl;
    server_name hk01.example.com;
    ...
}
```

## 快速开始

### 环境要求

- Bun >= 1.0.0
- SQLite3
- Node.js >= 18（仅用于开发时的某些工具）

### 安装依赖

```bash
# 安装 Bun（如果还没有）
curl -fsSL https://bun.sh/install | bash

# 安装项目依赖
bun install
```

### 配置

1. 复制环境变量模板：
```bash
cp config/.env.example config/.env
```

2. 编辑配置文件：
```bash
# 编辑 config/config.toml
nano config/config.toml

# 编辑环境变量
nano config/.env
```

### 数据库迁移

```bash
# 运行数据库迁移
bun run db:migrate
```

### 启动服务

```bash
# 开发模式
bun run dev

# 生产模式
bun run start
```

服务将默认运行在 `http://localhost:3000`

## 部署



### 使用 podman 部署

```bash
# 构建镜像
docker build -t nodehub-api .

# 运行容器
docker run -d \
  --name nodehub-api \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  nodehub-api
```

### 使用 systemd 部署

创建服务文件 `/etc/systemd/system/nodehub-api.service`:

```ini
[Unit]
Description=NodeHub API Service
After=network.target

[Service]
Type=simple
User=nodehub
WorkingDirectory=/opt/nodehub-api
ExecStart=/usr/bin/bun run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable nodehub-api
sudo systemctl start nodehub-api
```

## 测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/modules/host.test.ts

# 运行测试并查看覆盖率
bun test --coverage
```

## 开发

### 项目脚本

```bash
# 开发模式（热重载）
bun run dev

# 类型检查
bun run type-check

# 代码格式化
bun run format

# 代码检查
bun run lint

# 生成数据库迁移
bun run db:generate

# 推送数据库迁移
bun run db:push
```

### 技术文档

- [Bun 文档](https://bun.sh/docs)
- [Elysia 文档](https://elysiajs.com/)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)

## 故障排查

### 常见问题

**1. 数据库连接失败**
- 检查 SQLite 数据库文件权限
- 确认数据库文件路径正确

**2. DNS 解析失败**
- 检查 DNS 服务商 API 密钥
- 查看后台任务队列状态

**3. 配置文件下发失败**
- 确认模板文件存在
- 检查节点名称是否正确

### 日志查看

```bash
# 使用 PM2
pm2 logs nodehub-api

# 使用 systemd
sudo journalctl -u nodehub-api -f

# 直接查看日志文件
tail -f logs/app.log
```

## 路线图

- [ ] Phase 1: 基础架构搭建
  - [ ] 项目初始化和依赖安装
  - [ ] 数据库 Schema 设计和迁移
  - [ ] 基础 API 框架搭建

- [ ] Phase 2: 核心模块开发
  - [ ] Host 模块实现
  - [ ] Node 模块实现
  - [ ] Config 模块实现

- [ ] Phase 3: 后台任务开发
  - [ ] DNS Worker 实现
  - [ ] Panel 集成实现
  - [ ] 监控和通知系统

- [ ] Phase 4: 测试和部署
  - [ ] 单元测试编写
  - [ ] 集成测试编写
  - [ ] 部署文档完善

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request
