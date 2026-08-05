#!/bin/bash

set -e

echo "========================================="
echo " MMS Project Setup for New PC"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check Node.js
echo -e "${YELLOW}[1/6] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "  → https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version $NODE_VERSION detected. Version 18+ is required.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node -v) found${NC}"

# 2. Check PostgreSQL
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    echo "  → Ubuntu/Debian: sudo apt install postgresql"
    echo "  → macOS: brew install postgresql"
    exit 1
fi
if ! pg_isready -h localhost &> /dev/null; then
    echo -e "${YELLOW}  PostgreSQL is not running. Attempting to start...${NC}"
    sudo systemctl start postgresql 2>/dev/null || sudo pg_ctlcluster 16 main start 2>/dev/null || {
        echo -e "${RED}  Could not start PostgreSQL. Please start it manually.${NC}"
        exit 1
    }
fi
echo -e "${GREEN}  ✓ PostgreSQL is running${NC}"

# 3. Install npm dependencies
echo -e "${YELLOW}[3/6] Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# 4. Setup PostgreSQL user and database
echo -e "${YELLOW}[4/6] Setting up PostgreSQL user and database...${NC}"
sudo -u postgres psql -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';" 2>/dev/null || echo "  → User mmsuser already exists"
sudo -u postgres psql -c "CREATE DATABASE mms OWNER mmsuser;" 2>/dev/null || echo "  → Database mms already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mms TO mmsuser;" 2>/dev/null || true
echo -e "${GREEN}  ✓ User and database ready${NC}"

# 5. Import database dump
echo -e "${YELLOW}[5/6] Importing database dump...${NC}"
if [ -f "database-dump.sql" ]; then
    PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f database-dump.sql --quiet
    echo -e "${GREEN}  ✓ Database imported successfully${NC}"
else
    echo -e "${YELLOW}  ⚠ database-dump.sql not found. Running schema only...${NC}"
    PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f supabase/schema-local.sql --quiet
    echo -e "${GREEN}  ✓ Schema applied${NC}"
fi

# 6. Create uploads directory
echo -e "${YELLOW}[6/6] Creating uploads directory...${NC}"
mkdir -p public/uploads/avatars
echo -e "${GREEN}  ✓ Uploads directory ready${NC}"

echo ""
echo "========================================="
echo -e "${GREEN} Setup Complete!${NC}"
echo "========================================="
echo ""
echo "  To start the development server:"
echo "    npm run dev"
echo ""
echo "  The app will be available at:"
echo "    http://localhost:3000"
echo ""
echo "  Default credentials (if imported from dump):"
echo "    Check the database for existing users"
echo ""
