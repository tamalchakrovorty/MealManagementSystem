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
    echo "  Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}ERROR: Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}OK: Node.js $(node -v)${NC}"

# 2. Check PostgreSQL
echo -e "${YELLOW}[2/6]${NC} Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: PostgreSQL is not installed.${NC}"
    echo "  Ubuntu/Debian: sudo apt install postgresql"
    echo "  macOS: brew install postgresql"
    exit 1
fi
if ! pg_isready -h localhost &> /dev/null; then
    echo -e "${YELLOW}  PostgreSQL is not running. Attempting to start...${NC}"
    sudo systemctl start postgresql 2>/dev/null || sudo pg_ctlcluster 16 main start 2>/dev/null || {
        echo -e "${RED}  Could not start PostgreSQL. Please start it manually.${NC}"
        exit 1
    }
fi
echo -e "${GREEN}OK: PostgreSQL is running${NC}"

# 3. Install npm dependencies
echo -e "${YELLOW}[3/6]${NC} Installing npm dependencies..."
npm install
echo -e "${GREEN}OK: Dependencies installed${NC}"

# 4. Setup PostgreSQL user and database
echo -e "${YELLOW}[4/6]${NC} Setting up PostgreSQL user and database..."
sudo -u postgres psql -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';" 2>/dev/null || echo "  User mmsuser already exists"
sudo -u postgres psql -c "CREATE DATABASE mms OWNER mmsuser;" 2>/dev/null || echo "  Database mms already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mms TO mmsuser;" 2>/dev/null || true
echo -e "${GREEN}OK: User and database ready${NC}"

# 5. Import database
echo -e "${YELLOW}[5/6]${NC} Importing database..."
if [ -f "supabase/database-v5-dump.sql" ]; then
    PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f supabase/database-v5-dump.sql --quiet
    echo -e "${GREEN}OK: Database imported${NC}"
elif [ -f "supabase/schema-cockroachdb.sql" ]; then
    PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f supabase/schema-cockroachdb.sql --quiet
    echo -e "${GREEN}OK: Schema applied${NC}"
else
    echo -e "${RED}  No database files found in supabase/${NC}"
    exit 1
fi

# 6. Create .env.local
echo -e "${YELLOW}[6/7]${NC} Creating .env.local..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
DATABASE_URL=postgresql://mmsuser:mmspass@localhost:5432/mms
JWT_SECRET=mms-local-dev-secret-key-change-in-production
EOF
    echo -e "${GREEN}OK: .env.local created${NC}"
else
    echo -e "${GREEN}OK: .env.local already exists${NC}"
fi

# 7. Create uploads directory
echo -e "${YELLOW}[7/7]${NC} Creating uploads directory..."
mkdir -p public/uploads/avatars
echo -e "${GREEN}OK: Uploads directory ready${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "========================================="
echo ""
echo "  To start the dev server:"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
