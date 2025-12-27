# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NodeHub API is a centralized node management service that acts as a middle layer between VPS nodes (reporting status and requesting configs) and frontend panels (SSP/SRP). The system manages:

- Host information (VPS hardware, traffic, uptime)
- Node configuration (proxy settings, domains, ports)
- Config file distribution (Xray, Nginx templates)
- DNS management (automatic DNS record updates)
- Panel integration (SSP, SRP frontend sync)

**Communication flow**: `Node (VPS) <--> NodeHub API <--> Panel (SSP/SRP)`

## Technology Stack

- **Runtime**: Bun (high-performance JavaScript runtime with native TypeScript)
- **Web Framework**: Elysia (type-safe routes optimized for Bun)
- **Database**: SQLite3 with Drizzle ORM
- **Config**: TOML (Bun native) + ENV + JSON (templates)
- **Background Tasks**: PQueue (in-memory queue for DNS operations)
- **API Docs**: @elysiajs/swagger (accessible at `/swagger`)
- **Deployment**: systemd or Podman

## Common Commands

```bash
# Development
bun run dev              # Start with hot reload
bun run start            # Production mode

# Database
bun run db:generate      # Generate Drizzle migrations
bun run db:push          # Push schema changes
bun run db:migrate       # Run migrations

# Testing
bun test                 # Run all tests
bun test path/to/test.ts # Run specific test
bun test --coverage      # With coverage report

# Code Quality
bun run type-check       # TypeScript type checking
bun run lint             # Lint code
bun run format           # Format code
```

## Architecture

### Module Structure

Each module in `src/modules/` follows this pattern:
- `routes.ts` - Elysia API route definitions
- `service.ts` - Business logic layer
- `model.ts` - Data models and interfaces

**API Modules** (external interfaces):
1. `host/` - VPS host management (hardware info, traffic stats, IP monitoring)
2. `node/` - Node management (configuration, domain allocation, ID assignment)
3. `config/` - Config file distribution (templates for Xray, Nginx)

**Background Modules** (internal services):
4. `dns/` + `workers/dns.ts` - DNS worker using PQueue for async DNS operations
5. `panel/` - Panel adapters (ssp.ts, srp.ts) for frontend integration
6. `utils/` - Logger, Telegram notifications, validators

### Key Design Decisions

**Config Templates**: Configuration templates (Xray, Nginx) should be in `templates/` at the root level, not in `src/`. This allows users to modify templates after deployment via Podman volume mounts without rebuilding.

**API Response Format**: All endpoints must return standardized responses:
```json
// Success
{ "success": true, "data": {...}, "error": null }

// Failure
{ "success": false, "data": null, "error": {"code": "ERROR_CODE", "message": "..."} }
```

**DNS Operations**: DNS updates should be queued in `workers/dns.ts` using PQueue to avoid rate limiting. The DNS service in `modules/dns/` manages provider adapters in `modules/dns/providers/`.

**Panel Integration**: Panel adapters (`modules/panel/ssp.ts`, `modules/panel/srp.ts`) abstract the differences between SSP and SRP APIs. They handle node sync and user subscription management.

## Configuration Files

- `config/config.toml` - Main TOML configuration (Bun native parsing)
- `config/.env` - Environment variables (API keys, secrets)
- `config/panels/*.toml` - Panel-specific configurations
- `templates/xray/*.json` - Xray config templates (user-editable)
- `templates/nginx/*.conf` - Nginx config templates (user-editable)

## Data Structures

See README.md for complete YAML data structure reference. Key entities:
- **Host**: VPS physical server info (CPU, memory, disk, network, location)
- **Node**: Proxy node instance (panel integration, ports, proxy config, domain)
- **Config**: System-wide config (panel APIs, domain DNS settings, notifications)

## Development Notes

- Use Elysia's type-safe route handlers with TypeScript
- Swagger documentation auto-generates from Elysia schema definitions
- Drizzle ORM uses SQLite - define schemas in `src/db/schema.ts`
- Background workers (`src/workers/`) run independently of API request lifecycle
- When adding DNS providers, create adapter in `modules/dns/providers/`
- Template files in `templates/` are loaded at runtime, not build time

## Deployment

**Podman** (preferred):
```bash
podman build -t nodehub-api .
podman run -d --name nodehub-api \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/templates:/app/templates \
  -v $(pwd)/data:/app/data \
  nodehub-api
```

**systemd**: Service file at `/etc/systemd/system/nodehub-api.service` runs `bun run start`




## 命令 和 指令 
Context:
`where`: coding 文件的位置 或 模块名字
`why`: 阐述核心业务逻辑或修改动机。请以此作为理解代码“意图”的最高准则。
`how`: coding的实现思路、步骤、想法

Specification:
`input` `in`: 函数、模块、API 输入的参数
`output` `out`: 函数、模块、API 预期返回的 数据结构 、 状态 
`do`: 核心任务清单, 按步骤拆解 模块 需要执行的具体动作

Validation:
`must`: 验收标准。代码完成后，必须逐一核对是否满足这些安全检查、性能要求或逻辑验证。


## 工作流程 wordflow 
*Initialization*:
1. 全局认知: 读取 *README.md* 构建项目拓扑结构、核心数据结构及全局模块依赖.
2. 根据 <where> 精确锁定目标代码/模块/API.
3. 主动读取 *AI/* 文件夹下的 *.yaml* 配置, 提取该模块的 <input> 、<output>规范, <must>业务约束.
3. 结合 <why> 动机 和 <how>方法,  coding前确保技术路径闭环.
将 <how> 拆解为 <do> 原子列表, 必须是有序的 step by step 任务.

*Development*:
逐一执行 <do> 任务, 每一步必须检查是否 背离 <input> <output> 定义的标准.
所有代码必须 100% 覆盖 <must> 中标注的业务约束.
依据最新 <must> 条件,同步更新 *tests/* 下测试用例.
执行测试, 确保代码通过自动化测试.

*Documentation & Archiving*:
测试通过后, 立即更新 *AI* 文件夹中对应的 模块、API的 *.yaml* 定义,确保*代码即配置*.
11. 在 AI/updates/ 目录下, 按照 <YYYY-MM-DD_HH-mm>.yaml 生成变更日志,格式如下:
```yaml
when: 2000-01-01T11:22:30 # ISO 8601 时间格式
where: 
  - path_to_file1
  - path_to_file2
why: # 简述本次修改的业务痛点
how: # 简述核心实现方案（策略、算法、架构变更）
must: # 记录本次修改通过的关键验证项
```
