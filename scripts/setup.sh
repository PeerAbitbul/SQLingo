#!/bin/bash

# Qognix Setup Script
# Automated setup for development environment

set -e

echo "=================================="
echo "  Qognix Setup Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python not found. Please install Python 3.10+ first.${NC}"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL not found. Please install PostgreSQL 15+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites found${NC}"
echo ""

# Database setup
echo "=================================="
echo "  Database Setup"
echo "=================================="

read -p "Database name [qognix_cloud]: " DB_NAME
DB_NAME=${DB_NAME:-qognix_cloud}

read -p "Database user [peer]: " DB_USER
DB_USER=${DB_USER:-peer}

read -sp "Database password: " DB_PASSWORD
echo ""

# Create database
echo "Creating database..."
PGPASSWORD=$DB_PASSWORD createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database may already exist"

echo -e "${GREEN}✓ Database setup complete${NC}"
echo ""

# Backend setup
echo "=================================="
echo "  Backend Setup"
echo "=================================="

cd server/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Create .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env <<EOF
# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Secret
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Redis
REDIS_URL=redis://localhost:6379/0

# Stripe (Test Mode) - Add your keys here
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# AI Provider API Keys (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Email (optional)
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@qognix.com

# App Configuration
APP_NAME=Qognix Cloud
APP_VERSION=0.1.0
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
EOF
    echo -e "${YELLOW}⚠ Please edit server/backend/.env with your Stripe keys${NC}"
fi

# Run migration
echo "Running database migrations..."
python run_migration.py

cd ../..

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Frontend Portal setup
echo "=================================="
echo "  Frontend Portal Setup"
echo "=================================="

cd server/frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install --silent

# Create .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    echo "VITE_API_URL=http://127.0.0.1:8001" > .env.local
fi

cd ../..

echo -e "${GREEN}✓ Frontend Portal setup complete${NC}"
echo ""

# Desktop Frontend setup
echo "=================================="
echo "  Desktop App Setup"
echo "=================================="

cd desktop/frontend

# Install dependencies
echo "Installing npm dependencies..."
npm install --silent

# Create .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local <<EOF
VITE_SERVER_URL=http://127.0.0.1:8001
VITE_PORTAL_URL=http://localhost:3001
EOF
fi

cd ../..

echo -e "${GREEN}✓ Desktop App setup complete${NC}"
echo ""

# Desktop Backend setup (optional)
echo "=================================="
echo "  Desktop Backend Setup"
echo "=================================="

cd desktop/backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

cd ../..

echo -e "${GREEN}✓ Desktop Backend setup complete${NC}"
echo ""

# Final instructions
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo -e "${GREEN}✓ All components are set up successfully!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Add your Stripe keys to server/backend/.env:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_PUBLISHABLE_KEY"
echo "   - STRIPE_PRICE_ID"
echo ""
echo "2. Start the services:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ cd server/backend"
echo "   $ source venv/bin/activate"
echo "   $ python main.py"
echo ""
echo "   Terminal 2 - Frontend Portal:"
echo "   $ cd server/frontend"
echo "   $ npm run dev"
echo ""
echo "   Terminal 3 - Stripe Webhooks:"
echo "   $ stripe listen --forward-to http://127.0.0.1:8001/webhooks/stripe"
echo ""
echo "   (Optional) Terminal 4 - Desktop App:"
echo "   $ cd desktop/frontend"
echo "   $ npm run dev"
echo ""
echo "3. Access the portal at: http://localhost:3001"
echo ""
echo "See SETUP_AND_RUN.md for detailed instructions."
echo ""
