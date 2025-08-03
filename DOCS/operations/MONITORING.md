# Monitoring Setup Guide

## Overview

This guide provides simple, cost-effective monitoring solutions for Drishti's solopreneur operations. Focus is on free and low-cost tools that provide essential visibility without enterprise complexity.

## 🎯 Monitoring Objectives

### Primary Goals
- **Uptime Monitoring**: Ensure application availability
- **Error Tracking**: Catch and resolve issues quickly
- **Performance Monitoring**: Basic response time and resource usage
- **Cost Monitoring**: Track infrastructure costs
- **Security Monitoring**: Basic security event tracking

### Success Metrics
- **99% Uptime**: Target availability
- **<2 second response time**: Performance target
- **<5 minute error detection**: Quick issue identification
- **Monthly cost alerts**: Budget management

## 🆓 Free Monitoring Tools

### 1. UptimeRobot (Free Tier)
**Purpose**: Website uptime monitoring
**Cost**: Free for up to 50 monitors
**Setup Time**: 5 minutes

#### Setup Steps
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors for:
   - Main website: `https://yourdomain.com`
   - API health: `https://api.yourdomain.com/health`
   - Admin panel: `https://admin.yourdomain.com`

#### Configuration
```
Monitor Type: HTTP(s)
Monitoring Interval: 5 minutes
Alert Contacts: Your email + SMS (if available)
Keyword Monitoring: "healthy" or "ok"
```

#### Alerts Setup
- **Email**: Immediate notification
- **SMS**: For critical downtime (if budget allows)
- **Slack/Discord**: Team notifications (future)

### 2. Google Analytics (Free)
**Purpose**: User behavior and performance monitoring
**Cost**: Free
**Setup Time**: 15 minutes

#### Key Metrics to Track
- **Page Load Times**: Core Web Vitals
- **User Sessions**: Active users and engagement
- **Error Pages**: 404s and other errors
- **Mobile Performance**: Mobile-specific metrics

#### Setup Steps
1. Create Google Analytics account
2. Add tracking code to mobile app and web components
3. Set up custom events for key actions
4. Configure goals and conversions

### 3. Sentry (Free Tier)
**Purpose**: Error tracking and performance monitoring
**Cost**: Free for 5,000 errors/month
**Setup Time**: 30 minutes

#### Setup for API (Node.js/Fastify)
```javascript
// apps/api/src/config/monitoring.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});

export { Sentry };
```

#### Setup for Mobile (React Native)
```javascript
// apps/mobile/src/config/monitoring.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

export { Sentry };
```

### 4. GitHub Actions Monitoring
**Purpose**: CI/CD pipeline monitoring
**Cost**: Free (included with GitHub)
**Setup Time**: 10 minutes

#### Key Metrics
- **Build Success Rate**: Track deployment reliability
- **Build Duration**: Monitor CI/CD performance
- **Test Coverage**: Code quality metrics
- **Security Scans**: Automated security checks

## 💰 Low-Cost Monitoring Tools ($5-20/month)

### 1. Better Uptime ($15/month)
**Purpose**: Advanced uptime monitoring with status pages
**Features**:
- Public status page
- Advanced alerting
- Performance monitoring
- SSL certificate monitoring

### 2. LogRocket ($99/month - consider when revenue allows)
**Purpose**: Session replay and performance monitoring
**When to Consider**: When monthly revenue > $5,000

### 3. Datadog (Free tier + paid features)
**Purpose**: Infrastructure monitoring
**Free Tier**: 5 hosts, 1-day retention
**Paid**: $15/host/month

## 📊 Essential Dashboards

### 1. Daily Operations Dashboard
**Tools**: UptimeRobot + Google Analytics
**Check Frequency**: Daily (5 minutes)

#### Key Metrics
- ✅ **Uptime Status**: All services operational
- ✅ **Response Times**: <2 seconds average
- ✅ **Error Rate**: <1% of requests
- ✅ **Active Users**: Daily active users
- ✅ **New Signups**: User growth tracking

### 2. Weekly Performance Review
**Tools**: Sentry + Google Analytics
**Check Frequency**: Weekly (30 minutes)

#### Key Metrics
- **Error Trends**: Week-over-week error rates
- **Performance Trends**: Response time trends
- **User Engagement**: Session duration and bounce rate
- **Feature Usage**: Most/least used features
- **Mobile vs Web**: Platform performance comparison

### 3. Monthly Business Dashboard
**Tools**: All monitoring tools + cost tracking
**Check Frequency**: Monthly (2 hours)

#### Key Metrics
- **Infrastructure Costs**: Monthly spend tracking
- **User Growth**: Monthly active users
- **Performance Summary**: Monthly averages
- **Security Events**: Security incident summary
- **Capacity Planning**: Resource usage trends

## 🚨 Alert Configuration

### Critical Alerts (Immediate Response)
- **Website Down**: >5 minutes downtime
- **API Errors**: >10 errors in 5 minutes
- **Database Issues**: Connection failures
- **SSL Certificate**: Expiring in 7 days
- **High Error Rate**: >5% error rate

### Warning Alerts (Next Business Day)
- **Slow Response**: >5 seconds response time
- **High CPU/Memory**: >80% usage for 30 minutes
- **Low Disk Space**: <20% free space
- **Failed Backups**: Backup job failures
- **Security Events**: Suspicious activity

### Info Alerts (Weekly Summary)
- **Performance Summary**: Weekly performance report
- **User Growth**: Weekly user statistics
- **Cost Summary**: Weekly infrastructure costs
- **Security Summary**: Weekly security events

## 🔧 Implementation Checklist

### Week 1: Basic Monitoring
- [ ] Set up UptimeRobot monitors
- [ ] Configure Google Analytics
- [ ] Install Sentry error tracking
- [ ] Set up basic email alerts
- [ ] Test all monitoring systems

### Week 2: Advanced Setup
- [ ] Create monitoring dashboards
- [ ] Configure alert thresholds
- [ ] Set up weekly reports
- [ ] Document monitoring procedures
- [ ] Train on monitoring tools

### Week 3: Optimization
- [ ] Fine-tune alert sensitivity
- [ ] Add custom metrics
- [ ] Set up automated reports
- [ ] Create monitoring runbook
- [ ] Review and adjust

## 📈 Scaling Monitoring

### When to Upgrade (Revenue Thresholds)

#### $1,000/month Revenue
- Add Better Uptime for status pages
- Upgrade Sentry to paid plan
- Add SSL monitoring

#### $5,000/month Revenue
- Add LogRocket for session replay
- Implement custom metrics
- Add performance budgets

#### $10,000/month Revenue
- Add Datadog for infrastructure monitoring
- Implement APM (Application Performance Monitoring)
- Add custom alerting workflows

#### $25,000/month Revenue
- Consider enterprise monitoring solutions
- Add 24/7 monitoring service
- Implement SLA monitoring

## 🛠️ Monitoring Scripts

### Health Check Endpoint
```javascript
// apps/api/src/routes/health.ts
import { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: await checkDatabase(),
      version: process.env.npm_package_version,
    };
    
    return health;
  });
}

async function checkDatabase() {
  try {
    // Add your database health check here
    return { status: 'connected' };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}
```

### Simple Monitoring Script
```bash
#!/bin/bash
# scripts/check-health.sh

API_URL="https://api.yourdomain.com/health"
WEBSITE_URL="https://yourdomain.com"

echo "Checking API health..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

echo "Checking website..."
web_status=$(curl -s -o /dev/null -w "%{http_code}" $WEBSITE_URL)

if [ $api_status -eq 200 ] && [ $web_status -eq 200 ]; then
    echo "✅ All systems operational"
else
    echo "❌ System issues detected"
    echo "API Status: $api_status"
    echo "Website Status: $web_status"
fi
```

## 📋 Daily Monitoring Routine (5 minutes)

### Morning Check (2 minutes)
1. **Check UptimeRobot dashboard**: All green?
2. **Review overnight alerts**: Any issues?
3. **Quick Sentry check**: New errors?
4. **Google Analytics**: Traffic normal?

### Evening Check (3 minutes)
1. **Review daily metrics**: Performance trends
2. **Check error logs**: Any patterns?
3. **Verify backups**: Completed successfully?
4. **Plan tomorrow**: Any issues to address?

## 🔍 Troubleshooting Common Issues

### High Error Rates
1. **Check Sentry**: Identify error patterns
2. **Review logs**: Look for common causes
3. **Check recent deployments**: Rollback if needed
4. **Monitor user reports**: Social media, support

### Slow Performance
1. **Check response times**: Identify slow endpoints
2. **Review database queries**: Optimize if needed
3. **Check server resources**: CPU, memory, disk
4. **Analyze traffic patterns**: Unusual spikes?

### Monitoring Tool Issues
1. **Verify API keys**: Check configuration
2. **Test connectivity**: Network issues?
3. **Check quotas**: Free tier limits reached?
4. **Review documentation**: Tool-specific troubleshooting

## 📚 Additional Resources

### Documentation
- [UptimeRobot Documentation](https://uptimerobot.com/help/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Google Analytics Help](https://support.google.com/analytics/)

### Monitoring Best Practices
- [Site Reliability Engineering](https://sre.google/books/)
- [Monitoring Distributed Systems](https://landing.google.com/sre/sre-book/chapters/monitoring-distributed-systems/)
- [Error Budgets](https://sre.google/workbook/error-budget-policy/)

---

**Document Control**
- **Author**: AI System Analyst
- **Version**: 1.0
- **Last Updated**: January 2025
- **Review Cycle**: Quarterly
- **Next Review**: April 2025