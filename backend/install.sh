#!/bin/bash

# Vietnamese Tax Filing API - Server Installation Script
# This script installs the Python backend directly on the server

set -e  # Exit on any error

echo "=== Vietnamese Tax Filing API Installation ==="
echo "Installing Python backend directly on server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Update system
print_status "Updating system packages..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt update && sudo apt upgrade -y
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf update -y
else
    print_warning "Unsupported OS. Please install dependencies manually."
fi

# Install Python 3.11
print_status "Installing Python 3.11..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt install software-properties-common -y
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt update
    sudo apt install python3.11 python3.11-venv python3.11-dev python3.11-distutils -y
    
    # Install pip for Python 3.11
    curl -sS https://bootstrap.pypa.io/get-pip.py | sudo python3.11
    
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf install python3.11 python3.11-devel python3.11-pip -y
fi

# Verify Python installation
if ! command -v python3.11 &> /dev/null; then
    print_error "Python 3.11 installation failed"
    exit 1
fi

print_status "Python 3.11 installed successfully: $(python3.11 --version)"

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt install postgresql postgresql-contrib -y
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf install postgresql postgresql-server postgresql-contrib -y
    sudo postgresql-setup --initdb
fi

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

print_status "PostgreSQL installed and started"

# Install Redis
print_status "Installing Redis..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt install redis-server -y
    # Configure Redis for systemd
    sudo sed -i 's/^# supervised no/supervised systemd/' /etc/redis/redis.conf
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf install redis -y
fi

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

print_status "Redis installed and started"

# Install Nginx
print_status "Installing Nginx..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt install nginx -y
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf install nginx -y
fi

sudo systemctl start nginx
sudo systemctl enable nginx

print_status "Nginx installed and started"

# Install Supervisor
print_status "Installing Supervisor..."
if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]]; then
    sudo apt install supervisor -y
elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Rocky"* ]]; then
    sudo dnf install supervisor -y
fi

sudo systemctl start supervisord
sudo systemctl enable supervisord

print_status "Supervisor installed and started"

# Create application user
print_status "Creating application user..."
if ! id "taxapp" &>/dev/null; then
    sudo useradd -m -s /bin/bash taxapp
    print_status "User 'taxapp' created"
else
    print_status "User 'taxapp' already exists"
fi

# Create application directory
APP_DIR="/home/taxapp/tax-filing-app"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown taxapp:taxapp $APP_DIR

# Copy application files
print_status "Setting up application files..."
sudo cp -r . $APP_DIR/
sudo chown -R taxapp:taxapp $APP_DIR

# Create Python virtual environment
print_status "Creating Python virtual environment..."
sudo -u taxapp python3.11 -m venv $APP_DIR/venv

# Install Python dependencies
print_status "Installing Python dependencies..."
sudo -u taxapp $APP_DIR/venv/bin/pip install --upgrade pip
sudo -u taxapp $APP_DIR/venv/bin/pip install -r $APP_DIR/requirements.txt

# Create necessary directories
print_status "Creating application directories..."
sudo -u taxapp mkdir -p $APP_DIR/uploads
sudo -u taxapp mkdir -p $APP_DIR/logs
sudo -u taxapp mkdir -p $APP_DIR/credentials
sudo chmod 755 $APP_DIR/uploads
sudo chmod 755 $APP_DIR/logs
sudo chmod 700 $APP_DIR/credentials

# Create environment file template
print_status "Creating environment configuration template..."
sudo -u taxapp cat > $APP_DIR/.env.template << 'EOF'
# Application
APP_NAME=Vietnamese Tax Filing API
VERSION=2.0.0
ENVIRONMENT=production
DEBUG=false

# Security - CHANGE THESE VALUES
SECRET_KEY=CHANGE-THIS-TO-A-SECURE-SECRET-KEY
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# Database - UPDATE WITH YOUR CREDENTIALS
DATABASE_URL=postgresql+asyncpg://tax_user:CHANGE_PASSWORD@localhost:5432/tax_filing_db
DATABASE_ECHO=false

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS - UPDATE WITH YOUR DOMAIN
ALLOWED_HOSTS=["http://localhost:3000","https://yourdomain.com"]

# Google Cloud / ADK - UPDATE WITH YOUR CREDENTIALS
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
EOF

# Make scripts executable
sudo chmod +x $APP_DIR/run_server.py
sudo chmod +x $APP_DIR/run_celery.py

print_status "Installation completed successfully!"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Configure database:"
echo "   sudo -u postgres createdb tax_filing_db"
echo "   sudo -u postgres createuser tax_user"
echo "   sudo -u postgres psql -c \"ALTER USER tax_user WITH PASSWORD 'your_password';\""
echo "   sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE tax_filing_db TO tax_user;\""
echo ""
echo "2. Configure environment:"
echo "   sudo -u taxapp cp $APP_DIR/.env.template $APP_DIR/.env"
echo "   sudo -u taxapp nano $APP_DIR/.env  # Edit with your settings"
echo ""
echo "3. Initialize database:"
echo "   cd $APP_DIR"
echo "   sudo -u taxapp ./venv/bin/python -c \"import asyncio; from app.core.database import init_db; asyncio.run(init_db())\""
echo ""
echo "4. Configure Supervisor (see SETUP_SERVER.md for details)"
echo ""
echo "5. Configure Nginx (see SETUP_SERVER.md for details)"
echo ""
echo "6. Test the application:"
echo "   cd $APP_DIR"
echo "   sudo -u taxapp ./venv/bin/python run_server.py"
echo ""
print_status "For detailed configuration instructions, see SETUP_SERVER.md"
