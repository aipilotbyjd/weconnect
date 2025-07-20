# Docker Network Fix Guide

## The Issue
Docker Desktop is having trouble connecting to Docker Hub due to proxy/network configuration issues.

## Solutions (Try in order)

### Solution 1: Reset Docker Desktop Network Settings
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Go to "Resources" → "Network"
4. Disable "Use kernel networking for DNS resolution"
5. Click "Apply & Restart"

### Solution 2: Clear Docker Desktop Data
1. Open Docker Desktop
2. Go to Settings → "Troubleshoot"
3. Click "Clean / Purge data"
4. Restart Docker Desktop

### Solution 3: Use Alternative Registry
Add this to your docker-compose.yml at the top:

```yaml
x-registry: &registry
  image: docker.io/library/
```

### Solution 4: Manual Image Pull
Try pulling images manually first:
```bash
docker pull docker.io/mongo:7
docker pull docker.io/redis:7-alpine
```

### Solution 5: Use Local MongoDB/Redis Installation
Instead of Docker, install MongoDB and Redis locally:

#### MongoDB (Windows)
1. Download from: https://www.mongodb.com/try/download/community
2. Install and start the service
3. Default connection: mongodb://localhost:27017

#### Redis (Windows)
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Or use WSL: `wsl -d Ubuntu -e sudo apt install redis-server`
3. Default connection: localhost:6379

### Solution 6: Use Docker Desktop Alternative
Consider using Podman Desktop or Rancher Desktop as alternatives.