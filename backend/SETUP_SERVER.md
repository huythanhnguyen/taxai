# Hướng dẫn cài đặt Backend Python trực tiếp trên Server

## Yêu cầu hệ thống

### Server Requirements
- Ubuntu 20.04+ hoặc CentOS 8+
- RAM: Tối thiểu 4GB, khuyến nghị 8GB+
- CPU: Tối thiểu 2 cores, khuyến nghị 4 cores+
- Disk: Tối thiểu 20GB free space
- Network: Kết nối internet ổn định

### Software Requirements
- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Nginx (cho production)
- Supervisor (cho process management)

## Bước 1: Cài đặt Python 3.11

### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev -y

# Install pip
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Verify installation
python3.11 --version
pip3.11 --version
```

### CentOS/RHEL
```bash
# Update system
sudo dnf update -y

# Install Python 3.11
sudo dnf install python3.11 python3.11-devel python3.11-pip -y

# Verify installation
python3.11 --version
pip3.11 --version
```

## Bước 2: Cài đặt PostgreSQL

### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- Trong PostgreSQL shell
CREATE DATABASE tax_filing_db;
CREATE USER tax_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tax_filing_db TO tax_user;
ALTER USER tax_user CREATEDB;
\q
```

### CentOS/RHEL
```bash
# Install PostgreSQL
sudo dnf install postgresql postgresql-server postgresql-contrib -y

# Initialize database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user (same SQL commands as above)
sudo -u postgres psql
```

## Bước 3: Cài đặt Redis

### Ubuntu/Debian
```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Uncomment and set: supervised systemd

# Start and enable Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
```

### CentOS/RHEL
```bash
# Install Redis
sudo dnf install redis -y

# Start and enable Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping
```

## Bước 4: Setup Application

### Tạo user cho application
```bash
# Create application user
sudo useradd -m -s /bin/bash taxapp
sudo usermod -aG sudo taxapp

# Switch to application user
sudo su - taxapp
```

### Clone và setup project
```bash
# Navigate to home directory
cd /home/taxapp

# Create application directory
mkdir -p tax-filing-app
cd tax-filing-app

# Copy your backend code here
# (Assuming you have the backend folder ready)

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

## Bước 5: Environment Configuration

### Tạo file .env
```bash
# Create environment file
nano .env
```

```env
# Application
APP_NAME=Vietnamese Tax Filing API
VERSION=2.0.0
ENVIRONMENT=production
DEBUG=false

# Security
SECRET_KEY=your-very-secure-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql+asyncpg://tax_user:your_secure_password@localhost:5432/tax_filing_db
DATABASE_ECHO=false

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
ALLOWED_HOSTS=["http://localhost:3000","https://yourdomain.com"]

# Google Cloud / ADK
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/home/taxapp/tax-filing-app/credentials/service-account.json
GEMINI_MODEL=gemini-2.5-flash-lite

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/home/taxapp/tax-filing-app/uploads
ALLOWED_FILE_TYPES=["pdf","jpg","jpeg","png"]

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Vietnamese Tax Authority APIs
TAX_AUTHORITY_BASE_URL=https://api.gdt.gov.vn
TAX_AUTHORITY_API_KEY=your-api-key
```

### Tạo thư mục cần thiết
```bash
# Create necessary directories
mkdir -p uploads
mkdir -p logs
mkdir -p credentials

# Set permissions
chmod 755 uploads
chmod 755 logs
chmod 700 credentials
```

## Bước 6: Database Migration

```bash
# Activate virtual environment
source venv/bin/activate

# Run database migrations
python -m alembic upgrade head

# Or if using direct SQLAlchemy
python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
"
```

## Bước 7: Process Management với Supervisor

### Cài đặt Supervisor
```bash
# Ubuntu/Debian
sudo apt install supervisor -y

# CentOS/RHEL
sudo dnf install supervisor -y

# Start and enable supervisor
sudo systemctl start supervisord
sudo systemctl enable supervisord
```

### Cấu hình FastAPI service
```bash
sudo nano /etc/supervisor/conf.d/tax-filing-api.conf
```

```ini
[program:tax-filing-api]
command=/home/taxapp/tax-filing-app/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
directory=/home/taxapp/tax-filing-app
user=taxapp
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/taxapp/tax-filing-app/logs/api.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
environment=PATH="/home/taxapp/tax-filing-app/venv/bin"
```

### Cấu hình Celery worker
```bash
sudo nano /etc/supervisor/conf.d/tax-filing-celery.conf
```

```ini
[program:tax-filing-celery]
command=/home/taxapp/tax-filing-app/venv/bin/celery -A app.core.celery worker --loglevel=info
directory=/home/taxapp/tax-filing-app
user=taxapp
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/taxapp/tax-filing-app/logs/celery.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
environment=PATH="/home/taxapp/tax-filing-app/venv/bin"
```

### Khởi động services
```bash
# Reload supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update

# Start services
sudo supervisorctl start tax-filing-api
sudo supervisorctl start tax-filing-celery

# Check status
sudo supervisorctl status
```

## Bước 8: Nginx Configuration (Production)

### Cài đặt Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo dnf install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/tax-filing-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload size
    client_max_body_size 10M;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files
    location /static/ {
        alias /home/taxapp/tax-filing-app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
}
```

### Enable site
```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/tax-filing-api /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Bước 9: SSL Certificate (Production)

### Sử dụng Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Bước 10: Monitoring và Logging

### Setup log rotation
```bash
sudo nano /etc/logrotate.d/tax-filing-app
```

```
/home/taxapp/tax-filing-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 taxapp taxapp
    postrotate
        supervisorctl restart tax-filing-api
        supervisorctl restart tax-filing-celery
    endscript
}
```

### Firewall configuration
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Bước 11: Testing

### Test API
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test API documentation
curl http://localhost:8000/api/docs
```

### Test database connection
```bash
# Activate virtual environment
source venv/bin/activate

# Test database
python -c "
import asyncio
from app.core.database import engine
async def test_db():
    async with engine.begin() as conn:
        result = await conn.execute('SELECT 1')
        print('Database connection successful')
asyncio.run(test_db())
"
```

## Maintenance Commands

### Start/Stop services
```bash
# Start all services
sudo supervisorctl start all

# Stop all services
sudo supervisorctl stop all

# Restart specific service
sudo supervisorctl restart tax-filing-api

# View logs
sudo supervisorctl tail -f tax-filing-api
```

### Update application
```bash
# Navigate to app directory
cd /home/taxapp/tax-filing-app

# Activate virtual environment
source venv/bin/activate

# Pull latest code
git pull origin main

# Install new dependencies
pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Restart services
sudo supervisorctl restart all
```

### Backup database
```bash
# Create backup
pg_dump -h localhost -U tax_user -d tax_filing_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U tax_user -d tax_filing_db < backup_file.sql
```

## Troubleshooting

### Common issues
1. **Port already in use**: `sudo lsof -i :8000`
2. **Permission denied**: Check file permissions and user ownership
3. **Database connection failed**: Verify PostgreSQL is running and credentials are correct
4. **Redis connection failed**: Check Redis service status
5. **Import errors**: Ensure virtual environment is activated and dependencies are installed

### Log locations
- API logs: `/home/taxapp/tax-filing-app/logs/api.log`
- Celery logs: `/home/taxapp/tax-filing-app/logs/celery.log`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- PostgreSQL logs: `/var/log/postgresql/`
- Redis logs: `/var/log/redis/`
