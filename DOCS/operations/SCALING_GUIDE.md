# Scaling Guide

## Overview

This guide provides practical scaling strategies for Drishti as it grows from a solopreneur operation to a larger business. The focus is on cost-effective, incremental scaling that aligns with revenue growth and user demand.

## 🎯 Scaling Objectives

### Primary Goals
- **Performance Maintenance**: Keep response times <2 seconds
- **Cost Efficiency**: Scale costs proportionally with revenue
- **Reliability**: Maintain 99.9% uptime during growth
- **User Experience**: No degradation during scaling
- **Operational Simplicity**: Avoid premature complexity

### Success Metrics
- **Response Time**: <2 seconds average
- **Uptime**: >99.9% availability
- **Cost Ratio**: Infrastructure costs <20% of revenue
- **Error Rate**: <1% of requests
- **User Satisfaction**: >4.5/5 rating

## 📊 Scaling Triggers

### Performance Triggers
- **Response Time**: >3 seconds average for 1 hour
- **CPU Usage**: >80% for 30 minutes
- **Memory Usage**: >85% for 30 minutes
- **Database Connections**: >80% of pool
- **Error Rate**: >2% for 15 minutes

### Business Triggers
- **User Growth**: 50% increase month-over-month
- **Revenue Growth**: $1K, $5K, $10K, $25K monthly milestones
- **Traffic Growth**: 100% increase in requests
- **Storage Growth**: >80% disk usage
- **Geographic Expansion**: New regions/countries

### Technical Triggers
- **Database Size**: >10GB
- **File Storage**: >100GB
- **Concurrent Users**: >100 simultaneous
- **API Requests**: >1M per month
- **Mobile App Downloads**: >10K downloads

## 🚀 Scaling Roadmap

### Phase 1: Startup (0-$1K MRR)
**Current State**: Single server, basic monitoring
**Users**: 0-100
**Infrastructure Cost**: $20-50/month

#### Architecture
```
[Users] → [Single Server]
           ├── API (Node.js)
           ├── Database (PostgreSQL)
           ├── File Storage (Local)
           └── Web App (Static)
```

#### Optimization Focus
- **Code Optimization**: Efficient algorithms and queries
- **Database Indexing**: Optimize slow queries
- **Caching**: Basic in-memory caching
- **Monitoring**: Basic uptime monitoring

#### Action Items
- [ ] Implement database indexing
- [ ] Add basic caching layer
- [ ] Set up monitoring alerts
- [ ] Optimize critical API endpoints

### Phase 2: Growth (1K-$5K MRR)
**Target State**: Optimized single server with CDN
**Users**: 100-500
**Infrastructure Cost**: $50-150/month

#### Architecture
```
[Users] → [CDN] → [Load Balancer] → [Single Server]
                                      ├── API (Node.js)
                                      ├── Database (PostgreSQL)
                                      ├── File Storage (S3)
                                      └── Web App (Static)
```

#### Scaling Actions
1. **Add CDN**: CloudFlare or AWS CloudFront
2. **External File Storage**: Move to AWS S3
3. **Database Optimization**: Connection pooling, query optimization
4. **Caching Layer**: Redis for session and data caching
5. **Monitoring Upgrade**: Add performance monitoring

#### Implementation Script
```bash
#!/bin/bash
# scripts/scale-phase2.sh

echo "🚀 Implementing Phase 2 Scaling"
echo "=============================="

# Step 1: Set up CDN (CloudFlare)
echo "Step 1: Setting up CDN..."
echo "Manual step: Configure CloudFlare for yourdomain.com"
echo "- Add DNS records"
echo "- Enable caching rules"
echo "- Configure SSL"

# Step 2: Install Redis
echo "Step 2: Installing Redis..."
docker run -d --name redis -p 6379:6379 redis:alpine
echo "✅ Redis installed"

# Step 3: Configure S3
echo "Step 3: Configuring S3..."
aws s3 mb s3://drishti-files
aws s3api put-bucket-cors --bucket drishti-files --cors-configuration file://s3-cors.json
echo "✅ S3 configured"

# Step 4: Update application configuration
echo "Step 4: Updating application configuration..."
cp .env.production .env.production.backup
echo "REDIS_URL=redis://localhost:6379" >> .env.production
echo "S3_BUCKET=drishti-files" >> .env.production
echo "CDN_URL=https://cdn.yourdomain.com" >> .env.production
echo "✅ Configuration updated"

# Step 5: Deploy changes
echo "Step 5: Deploying changes..."
./scripts/deploy-production.sh
echo "✅ Phase 2 scaling completed"
```

### Phase 3: Scale Up (5K-$10K MRR)
**Target State**: Horizontal scaling with load balancer
**Users**: 500-2000
**Infrastructure Cost**: $150-400/month

#### Architecture
```
[Users] → [CDN] → [Load Balancer] → [API Servers (2-3)]
                                   ├── [Database (Primary)]
                                   ├── [Database (Read Replica)]
                                   ├── [Redis Cluster]
                                   └── [File Storage (S3)]
```

#### Scaling Actions
1. **Horizontal API Scaling**: Multiple API server instances
2. **Database Read Replicas**: Separate read/write operations
3. **Redis Clustering**: Distributed caching
4. **Load Balancer**: Distribute traffic across servers
5. **Auto-scaling**: Basic auto-scaling rules

#### Implementation
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api1
      - api2
      - api3

  api1:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db-primary:5432/drishti
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db-primary
      - redis

  api2:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db-primary:5432/drishti
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db-primary
      - redis

  api3:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db-primary:5432/drishti
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db-primary
      - redis

  db-primary:
    image: postgres:15
    environment:
      - POSTGRES_DB=drishti
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  db-replica:
    image: postgres:15
    environment:
      - POSTGRES_DB=drishti
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_MASTER_SERVICE=db-primary
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  postgres_replica_data:
  redis_data:
```

### Phase 4: Scale Out ($10K-$25K MRR)
**Target State**: Multi-region with microservices
**Users**: 2000-10000
**Infrastructure Cost**: $400-1000/month

#### Architecture
```
[Users] → [Global CDN] → [Regional Load Balancers]
                         ├── [API Gateway]
                         ├── [Auth Service]
                         ├── [User Service]
                         ├── [Content Service]
                         ├── [Database Cluster]
                         ├── [Message Queue]
                         └── [File Storage (Multi-region)]
```

#### Scaling Actions
1. **Microservices**: Split monolith into services
2. **API Gateway**: Centralized API management
3. **Message Queues**: Asynchronous processing
4. **Database Sharding**: Horizontal database scaling
5. **Multi-region**: Deploy to multiple regions
6. **Container Orchestration**: Kubernetes or ECS

### Phase 5: Enterprise ($25K+ MRR)
**Target State**: Full enterprise architecture
**Users**: 10000+
**Infrastructure Cost**: $1000+/month

#### Architecture
```
[Users] → [Global CDN] → [API Gateway] → [Service Mesh]
                                         ├── [Auth Service]
                                         ├── [User Service]
                                         ├── [Content Service]
                                         ├── [Analytics Service]
                                         ├── [Database Cluster]
                                         ├── [Message Queues]
                                         ├── [Search Engine]
                                         └── [ML/AI Services]
```

#### Enterprise Features
1. **Service Mesh**: Advanced service communication
2. **Advanced Analytics**: Real-time analytics
3. **Machine Learning**: AI-powered features
4. **Advanced Security**: Enterprise security features
5. **Compliance**: SOC2, GDPR compliance
6. **24/7 Support**: Dedicated support team

## 🔧 Scaling Implementation

### Database Scaling

#### Read Replicas Setup
```sql
-- Create read replica user
CREATE USER replica_user WITH REPLICATION PASSWORD 'replica_password';

-- Configure primary database
-- In postgresql.conf:
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

-- In pg_hba.conf:
host replication replica_user replica_ip/32 md5
```

#### Connection Pooling
```javascript
// config/database.js
const { Pool } = require('pg');

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const replicaPool = new Pool({
  connectionString: process.env.DATABASE_REPLICA_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = {
  primary: primaryPool,
  replica: replicaPool,
};
```

#### Query Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_posts_user_id ON posts(user_id);
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Caching Strategy

#### Redis Implementation
```javascript
// config/redis.js
const Redis = require('redis');

const redis = Redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

module.exports = redis;
```

#### Caching Middleware
```javascript
// middleware/cache.js
const redis = require('../config/redis');

function cacheMiddleware(duration = 300) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original res.json
      const originalJson = res.json;
      
      res.json = function(data) {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
}

module.exports = cacheMiddleware;
```

### Load Balancing

#### Nginx Configuration
```nginx
# nginx.conf
upstream api_servers {
    least_conn;
    server api1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server api3:3000 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Auto-scaling

#### Docker Swarm Auto-scaling
```yaml
# docker-compose.swarm.yml
version: '3.8'
services:
  api:
    image: drishti/api:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - app-network

networks:
  app-network:
    driver: overlay
```

#### AWS ECS Auto-scaling
```json
{
  "family": "drishti-api",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "drishti/api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/drishti-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 📊 Monitoring & Metrics

### Scaling Metrics Dashboard
```bash
#!/bin/bash
# scripts/scaling-metrics.sh

echo "📊 Scaling Metrics Dashboard"
echo "============================"
echo

# Performance metrics
echo "🚀 Performance Metrics:"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.yourdomain.com/health)
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
MEMORY_USAGE=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')

echo "  Response Time: ${RESPONSE_TIME}s"
echo "  CPU Usage: ${CPU_USAGE}%"
echo "  Memory Usage: ${MEMORY_USAGE}MB"
echo

# Traffic metrics
echo "📈 Traffic Metrics:"
REQUESTS_PER_MINUTE=$(tail -60 /var/log/access.log | wc -l)
CONCURRENT_USERS=$(netstat -an | grep :3000 | grep ESTABLISHED | wc -l)
ERROR_RATE=$(tail -1000 /var/log/app.log | grep -c "ERROR" || echo "0")

echo "  Requests/Minute: $REQUESTS_PER_MINUTE"
echo "  Concurrent Users: $CONCURRENT_USERS"
echo "  Error Rate: $ERROR_RATE errors/1000 requests"
echo

# Database metrics
echo "🗄️  Database Metrics:"
DB_CONNECTIONS=$(psql -U postgres -d drishti_production -t -c "SELECT count(*) FROM pg_stat_activity;")
DB_SIZE=$(psql -U postgres -d drishti_production -t -c "SELECT pg_size_pretty(pg_database_size('drishti_production'));")
SLOW_QUERIES=$(psql -U postgres -d drishti_production -t -c "SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000;")

echo "  Active Connections: $DB_CONNECTIONS"
echo "  Database Size: $DB_SIZE"
echo "  Slow Queries: $SLOW_QUERIES"
echo

# Scaling recommendations
echo "💡 Scaling Recommendations:"
if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "  ⚠️  Consider adding more API servers (high response time)"
fi

if [ $CPU_USAGE -gt 80 ]; then
    echo "  ⚠️  Consider upgrading server CPU (high CPU usage)"
fi

if [ $CONCURRENT_USERS -gt 100 ]; then
    echo "  ⚠️  Consider implementing load balancing (high concurrent users)"
fi

if [ $DB_CONNECTIONS -gt 80 ]; then
    echo "  ⚠️  Consider adding database read replicas (high DB connections)"
fi
```

### Scaling Alerts
```bash
#!/bin/bash
# scripts/scaling-alerts.sh

# Performance thresholds
MAX_RESPONSE_TIME=2.0
MAX_CPU_USAGE=80
MAX_MEMORY_USAGE=85
MAX_ERROR_RATE=2

# Get current metrics
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.yourdomain.com/health)
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
ERROR_COUNT=$(tail -100 /var/log/app.log | grep -c "ERROR")

# Check thresholds and alert
if (( $(echo "$RESPONSE_TIME > $MAX_RESPONSE_TIME" | bc -l) )); then
    echo "🚨 SCALING ALERT: High response time (${RESPONSE_TIME}s)"
    echo "Recommendation: Add more API servers or optimize code"
fi

if [ $CPU_USAGE -gt $MAX_CPU_USAGE ]; then
    echo "🚨 SCALING ALERT: High CPU usage (${CPU_USAGE}%)"
    echo "Recommendation: Scale up server or add more instances"
fi

if [ $ERROR_COUNT -gt $MAX_ERROR_RATE ]; then
    echo "🚨 SCALING ALERT: High error rate ($ERROR_COUNT errors)"
    echo "Recommendation: Check application logs and fix issues"
fi
```

## 💰 Cost Management

### Scaling Cost Calculator
```bash
#!/bin/bash
# scripts/scaling-cost-calculator.sh

echo "💰 Scaling Cost Calculator"
echo "========================="
echo

# Current costs (monthly)
SERVER_COST=50
DATABASE_COST=20
STORAGE_COST=10
CDN_COST=5
MONITORING_COST=0

CURRENT_TOTAL=$((SERVER_COST + DATABASE_COST + STORAGE_COST + CDN_COST + MONITORING_COST))

echo "📊 Current Monthly Costs:"
echo "  Server: $${SERVER_COST}"
echo "  Database: $${DATABASE_COST}"
echo "  Storage: $${STORAGE_COST}"
echo "  CDN: $${CDN_COST}"
echo "  Monitoring: $${MONITORING_COST}"
echo "  Total: $${CURRENT_TOTAL}"
echo

# Scaling scenarios
echo "🚀 Scaling Scenarios:"
echo

echo "Phase 2 (1K-5K MRR):"
PHASE2_SERVER=100
PHASE2_DATABASE=40
PHASE2_STORAGE=25
PHASE2_CDN=15
PHASE2_MONITORING=20
PHASE2_TOTAL=$((PHASE2_SERVER + PHASE2_DATABASE + PHASE2_STORAGE + PHASE2_CDN + PHASE2_MONITORING))
echo "  Estimated Cost: $${PHASE2_TOTAL}/month"
echo "  Cost Ratio: $(echo "scale=1; $PHASE2_TOTAL * 100 / 3000" | bc)% of $3K MRR"
echo

echo "Phase 3 (5K-10K MRR):"
PHASE3_SERVER=250
PHASE3_DATABASE=100
PHASE3_STORAGE=50
PHASE3_CDN=30
PHASE3_MONITORING=50
PHASE3_TOTAL=$((PHASE3_SERVER + PHASE3_DATABASE + PHASE3_STORAGE + PHASE3_CDN + PHASE3_MONITORING))
echo "  Estimated Cost: $${PHASE3_TOTAL}/month"
echo "  Cost Ratio: $(echo "scale=1; $PHASE3_TOTAL * 100 / 7500" | bc)% of $7.5K MRR"
echo

echo "Phase 4 (10K-25K MRR):"
PHASE4_SERVER=600
PHASE4_DATABASE=200
PHASE4_STORAGE=100
PHASE4_CDN=50
PHASE4_MONITORING=100
PHASE4_TOTAL=$((PHASE4_SERVER + PHASE4_DATABASE + PHASE4_STORAGE + PHASE4_CDN + PHASE4_MONITORING))
echo "  Estimated Cost: $${PHASE4_TOTAL}/month"
echo "  Cost Ratio: $(echo "scale=1; $PHASE4_TOTAL * 100 / 17500" | bc)% of $17.5K MRR"
```

### Cost Optimization
```bash
#!/bin/bash
# scripts/cost-optimization.sh

echo "💡 Cost Optimization Recommendations"
echo "===================================="
echo

# Check resource utilization
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
MEMORY_USAGE=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "📊 Current Resource Utilization:"
echo "  CPU: ${CPU_USAGE}%"
echo "  Memory: ${MEMORY_USAGE}MB"
echo "  Disk: ${DISK_USAGE}%"
echo

echo "💡 Optimization Opportunities:"

if [ $CPU_USAGE -lt 30 ]; then
    echo "  💰 Consider downsizing server (low CPU usage)"
    echo "     Potential savings: $20-50/month"
fi

if [ $DISK_USAGE -lt 50 ]; then
    echo "  💰 Consider smaller disk size (low disk usage)"
    echo "     Potential savings: $10-20/month"
fi

# Check for unused resources
UNUSED_SNAPSHOTS=$(aws ec2 describe-snapshots --owner-ids self --query 'length(Snapshots)' 2>/dev/null || echo "0")
if [ $UNUSED_SNAPSHOTS -gt 10 ]; then
    echo "  💰 Clean up old snapshots ($UNUSED_SNAPSHOTS found)"
    echo "     Potential savings: $5-15/month"
fi

echo
echo "🎯 Cost Optimization Actions:"
echo "  1. Set up automated resource monitoring"
echo "  2. Implement auto-scaling to match demand"
echo "  3. Use spot instances for non-critical workloads"
echo "  4. Optimize database queries to reduce CPU usage"
echo "  5. Implement efficient caching to reduce database load"
echo "  6. Use CDN to reduce bandwidth costs"
echo "  7. Regular cleanup of unused resources"
```

## 📋 Scaling Checklist

### Pre-Scaling Assessment
- [ ] **Performance Baseline**: Current metrics documented
- [ ] **Bottleneck Identification**: Performance bottlenecks identified
- [ ] **Cost Analysis**: Scaling costs calculated
- [ ] **Risk Assessment**: Scaling risks evaluated
- [ ] **Rollback Plan**: Rollback procedure prepared
- [ ] **Monitoring**: Enhanced monitoring in place
- [ ] **Testing**: Scaling tested in staging environment
- [ ] **Documentation**: Scaling plan documented

### During Scaling
- [ ] **Backup Created**: Full system backup completed
- [ ] **Monitoring Active**: Real-time monitoring enabled
- [ ] **Gradual Rollout**: Incremental scaling approach
- [ ] **Performance Testing**: Load testing during scaling
- [ ] **Error Monitoring**: Error rates monitored
- [ ] **User Communication**: Users informed of potential impact
- [ ] **Team Availability**: Technical team available for issues

### Post-Scaling Validation
- [ ] **Performance Verification**: Improved performance confirmed
- [ ] **Functionality Testing**: All features working correctly
- [ ] **Error Rate Check**: Error rates within acceptable limits
- [ ] **Cost Validation**: Actual costs match projections
- [ ] **User Feedback**: User experience improved
- [ ] **Documentation Update**: Scaling results documented
- [ ] **Lessons Learned**: Scaling lessons captured
- [ ] **Next Steps**: Future scaling plans updated

## 🔧 Troubleshooting

### Common Scaling Issues

#### Database Connection Limits
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Increase connection limit
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();

-- Implement connection pooling
-- Use PgBouncer or similar
```

#### Memory Issues
```bash
# Check memory usage
free -h
top -o %MEM

# Clear cache if needed
sudo sync && sudo sysctl vm.drop_caches=3

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Load Balancer Issues
```bash
# Check nginx status
sudo nginx -t
sudo systemctl status nginx

# Check upstream servers
curl -I http://api1:3000/health
curl -I http://api2:3000/health

# Reload nginx configuration
sudo nginx -s reload
```

## 📚 Additional Resources

### Documentation
- [AWS Auto Scaling](https://aws.amazon.com/autoscaling/)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Kubernetes](https://kubernetes.io/docs/)
- [Database Scaling](https://www.postgresql.org/docs/current/high-availability.html)

### Tools
- [Load Testing: Artillery](https://artillery.io/)
- [Monitoring: Grafana](https://grafana.com/)
- [Container Orchestration: Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Database Monitoring: pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)

---

**Document Control**
- **Author**: AI System Analyst
- **Version**: 1.0
- **Last Updated**: January 2025
- **Review Cycle**: Quarterly
- **Next Review**: April 2025