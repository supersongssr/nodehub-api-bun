# NodeHub API - Quick Start Guide

## Prerequisites

- **Bun** >= 1.0.0 (Install: `curl -fsSL https://bun.sh/install | bash`)
- **Podman** or **Docker** (for containerized deployment)

## Installation

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

```bash
# Copy environment template
cp config/.env.example config/.env

# Edit with your configuration
nano config/.env
```

Required environment variables:
- `DATABASE_PATH` - SQLite database path (default: `./data/nodehub.db`)
- `PORT` - API server port (default: `3000`)

Optional:
- `TELEGRAM_BOT_TOKEN` - For notifications
- `TELEGRAM_CHAT_ID` - Telegram chat ID
- `DNS_PROVIDER` - DNS provider (cloudflare)
- `DNS_API_KEY` - DNS provider API key

### 3. Initialize Database

```bash
bun run db:push
```

## Development

### Start Development Server

```bash
bun run dev
```

The API will be available at `http://localhost:3000`

Swagger documentation at `http://localhost:3000/swagger`

### Run Tests

```bash
# Run all tests
bun test

# Run with coverage
bun run test:coverage
```

### Type Checking

```bash
bun run type-check
```

## Production Deployment

### Option 1: Podman (Recommended)

```bash
# Build image
podman build -t nodehub-api .

# Run container
podman run -d \
  --name nodehub-api \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/templates:/app/templates \
  -v $(pwd)/data:/app/data \
  nodehub-api
```

### Option 2: systemd

```bash
# Run deployment script
sudo ./deploy.sh

# Start service
sudo systemctl start nodehub-api

# Check status
sudo systemctl status nodehub-api

# View logs
sudo journalctl -u nodehub-api -f
```

## API Usage Examples

### 1. Register Host (VPS)

```bash
curl -X POST http://localhost:3000/hosts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vps-server-1",
    "ip": "192.168.1.100",
    "cpuCores": 4,
    "memoryTotal": 8192,
    "diskTotal": 100,
    "region": "US",
    "city": "New York"
  }'
```

### 2. Send Heartbeat

```bash
curl -X POST http://localhost:3000/hosts/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vps-server-1",
    "cpuUsage": 45.5,
    "memoryUsed": 4096,
    "diskUsed": 50,
    "uploadTotal": 1000000,
    "downloadTotal": 2000000,
    "uptime": 3600,
    "timestamp": 1703685600
  }'
```

### 3. Create Node

```bash
curl -X POST http://localhost:3000/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "panelType": "ssp",
    "panelNodeId": 1,
    "panelUrl": "https://ssp.example.com",
    "name": "node-1",
    "port": 8388,
    "proxyType": "shadowsocks",
    "domain": "node1.example.com"
  }'
```

### 4. Generate Config

```bash
curl -X POST http://localhost:3000/config/generate \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": 1,
    "configType": "xray",
    "template": "default"
  }'
```

## Module Architecture

Each module follows this structure:

```
src/modules/{module}/
├── model.ts      # Data interfaces and types
├── service.ts    # Business logic
└── routes.ts     # API endpoints
```

## Background Workers

- **DNS Worker** (`src/workers/dns.ts`) - Queues DNS updates using PQueue
- **Monitor Worker** (`src/workers/monitor.ts`) - Monitors hosts and sends notifications

## Configuration Templates

Templates are stored in `templates/` and can be edited after deployment:

- `templates/xray/` - Xray configuration templates (JSON)
- `templates/nginx/` - Nginx configuration templates (.conf)

## Troubleshooting

### Database Migration Issues

```bash
# Reset database
rm -f data/nodehub.db*
bun run db:push
```

### Port Already in Use

```bash
# Change port in config/.env
PORT=3001
```

### View Logs

```bash
# systemd
journalctl -u nodehub-api -f

# Podman
podman logs -f nodehub-api
```

## Support

- Documentation: See README.md
- API Docs: http://localhost:3000/swagger
- Issues: Report via GitHub Issues
