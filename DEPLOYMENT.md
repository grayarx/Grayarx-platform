# GrayArx Deployment Guide

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Production Deployment

```bash
# Build optimized production bundle
pnpm build

# Start production server
NODE_ENV=production pnpm start

# Verify deployment
curl https://your-domain.com/health
```

## Environment Configuration

### Required Environment Variables

```bash
# Database Connection
DATABASE_URL=mysql://username:password@host:3306/grayarx

# Authentication
JWT_SECRET=generate-a-strong-random-string
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Stripe (Payment Processing)
STRIPE_API_KEY=sk_live_your_stripe_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_API_KEY=your_twilio_api_key
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MODE=live

# SendGrid (Email)
SENDGRID_API_KEY=SG.your_sendgrid_key
EMAIL_USER=noreply@grayarx.com
EMAIL_PASSWORD=your_email_password

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.grayarx.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Configuration
VITE_APP_TITLE=GrayArx
VITE_APP_LOGO=https://your-cdn.com/logo.png

# Company Information
COMPANY_ENTERPRISE_NUMBER=your_enterprise_number
COMPANY_TAX_NUMBER=your_tax_number
COMPANY_BANK_ACCOUNT_NUMBER=your_account_number
COMPANY_BANK_BRANCH_CODE=your_branch_code
COMPANY_BANK_SWIFT_CODE=your_swift_code
COMPANY_DIRECTOR_ID=your_director_id
COMPANY_PHYSICAL_ADDRESS=Your Address

# API Keys
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
```

## Credential Setup

### Step 1: Gather Credentials

Before deployment, collect the following:

1. **Stripe**
   - API Key (starts with `sk_live_`)
   - Webhook Secret
   - Account ID

2. **Twilio**
   - Account SID
   - API Key
   - Phone Number (verified)

3. **SendGrid**
   - API Key (starts with `SG.`)
   - Verified sender email

4. **Manus OAuth**
   - App ID
   - OAuth Server URL
   - Portal URL

5. **Database**
   - Connection string
   - Username/password
   - Database name

### Step 2: Create Environment File

```bash
# Create .env.production file
cat > .env.production << EOF
DATABASE_URL=mysql://user:pass@host:3306/grayarx
JWT_SECRET=$(openssl rand -base64 32)
STRIPE_API_KEY=sk_live_your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_API_KEY=your_key
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=SG.your_key
EMAIL_USER=noreply@grayarx.com
# ... add other variables
EOF
```

### Step 3: Verify Credentials

```bash
# Test database connection
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection(process.env.DATABASE_URL)
  .then(() => console.log('✓ Database connected'))
  .catch(e => console.error('✗ Database error:', e.message));
"

# Test Stripe
curl https://api.stripe.com/v1/account \
  -u $STRIPE_API_KEY:

# Test Twilio
curl -X GET https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_API_KEY

# Test SendGrid
curl --request GET \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY"
```

## Database Setup

### Create Database

```sql
CREATE DATABASE grayarx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'grayarx'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON grayarx.* TO 'grayarx'@'localhost';
FLUSH PRIVILEGES;
```

### Run Migrations

```bash
# Generate migration files
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# Verify schema
pnpm drizzle-kit studio
```

### Backup Database

```bash
# Daily backup
mysqldump -u grayarx -p grayarx > backup-$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * mysqldump -u grayarx -p grayarx > /backups/grayarx-$(date +\%Y\%m\%d).sql
```

## Server Configuration

### Node.js Server

```bash
# Install PM2 for process management
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'grayarx',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Reverse Proxy

```nginx
upstream grayarx {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
}

server {
  listen 80;
  server_name grayarx.com www.grayarx.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name grayarx.com www.grayarx.com;

  ssl_certificate /etc/letsencrypt/live/grayarx.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/grayarx.com/privkey.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  client_max_body_size 100M;

  location / {
    proxy_pass http://grayarx;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  location /health {
    access_log off;
    proxy_pass http://grayarx;
  }
}
```

### SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d grayarx.com -d www.grayarx.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring & Health Checks

### Health Check Endpoint

```bash
# Check application health
curl https://grayarx.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-05-26T06:30:00Z",
#   "uptime": 3600,
#   "database": "connected",
#   "cache": "ok"
# }
```

### Monitoring Setup

```bash
# Install monitoring tools
npm install -g pm2-plus

# Enable monitoring
pm2 plus

# View dashboard
pm2 monit
```

### Log Management

```bash
# View logs
pm2 logs grayarx

# Rotate logs
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

## Security Checklist

- [ ] SSL/TLS certificate installed
- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] API keys rotated
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] CSRF tokens enabled
- [ ] Security headers set
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Logging enabled
- [ ] Alerting configured

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
pm2 stop grayarx
pm2 delete grayarx

# Restore previous code
git checkout previous-version
pnpm install
pnpm build

# Restore database
mysql grayarx < backup-previous.sql

# Restart application
pm2 start ecosystem.config.js
```

## Performance Optimization

### Caching

```bash
# Enable Redis caching
npm install redis

# Configure in environment
REDIS_URL=redis://localhost:6379
```

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_audit_log_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_session_user_id ON user_sessions(user_id);

-- Analyze query performance
EXPLAIN SELECT * FROM audit_logs WHERE timestamp > NOW() - INTERVAL 7 DAY;
```

### CDN Configuration

```bash
# Serve static assets from CDN
VITE_CDN_URL=https://cdn.grayarx.com

# Upload assets
aws s3 sync ./dist/assets s3://grayarx-cdn/assets --cache-control "max-age=31536000"
```

## Troubleshooting

### Common Issues

**Service won't start**
```bash
pm2 logs grayarx
# Check for port conflicts
lsof -i :3000
```

**Database connection error**
```bash
# Test connection
mysql -u grayarx -p -h localhost grayarx -e "SELECT 1"
```

**High memory usage**
```bash
# Monitor memory
pm2 monit

# Increase heap size
NODE_OPTIONS="--max-old-space-size=2048" pm2 start ecosystem.config.js
```

**Slow API responses**
```bash
# Enable query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

# Analyze queries
SHOW PROCESSLIST;
```

## Support

For deployment issues, contact: devops@grayarx.com
