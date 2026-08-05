#!/bin/bash
# MMS Project - One-Command Setup
# Run this on a new PC to set up everything automatically

set -e

echo "========================================="
echo "  MMS Project Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check Node.js
echo -e "${YELLOW}[1/6]${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed.${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}ERROR: Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}OK: $(node -v)${NC}"

# 2. Check PostgreSQL
echo -e "${YELLOW}[2/6]${NC} Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: PostgreSQL is not installed.${NC}"
    echo "Please install PostgreSQL from https://postgresql.org"
    exit 1
fi
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}WARNING: PostgreSQL is not running. Attempting to start...${NC}"
    sudo service postgresql start 2>/dev/null || sudo pg_ctlcluster 14 main start 2>/dev/null || true
fi
echo -e "${GREEN}OK: PostgreSQL found${NC}"

# 3. Install dependencies
echo -e "${YELLOW}[3/6]${NC} Installing npm dependencies..."
npm install
echo -e "${GREEN}OK: Dependencies installed${NC}"

# 4. Setup PostgreSQL database
echo -e "${YELLOW}[4/6]${NC} Setting up database..."
psql -U postgres -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';" 2>/dev/null || true
psql -U postgres -c "CREATE DATABASE mms OWNER mmsuser;" 2>/dev/null || true
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mms TO mmsuser;" 2>/dev/null || true
psql -U mmsuser -h localhost -d mms -f supabase/schema-local.sql 2>/dev/null || echo "Schema may already exist, continuing..."
echo -e "${GREEN}OK: Database ready${NC}"

# 5. Create .env.local
echo -e "${YELLOW}[5/6]${NC} Creating .env.local..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
DATABASE_URL=postgresql://mmsuser:mmspass@localhost:5432/mms
JWT_SECRET=mms-local-dev-secret-key-change-in-production
EOF
    echo -e "${GREEN}OK: .env.local created${NC}"
else
    echo -e "${GREEN}OK: .env.local already exists${NC}"
fi

# 6. Create uploads directory
echo -e "${YELLOW}[6/6]${NC} Creating uploads directory..."
mkdir -p public/uploads/avatars
echo -e "${GREEN}OK: Uploads directory ready${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "========================================="
echo ""
echo "To start the dev server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
