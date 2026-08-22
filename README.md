<p align="center">
  <img src="public/icon.png" alt="MMS Logo" width="100" />
</p>

<h1 align="center">Meal Management System</h1>

<p align="center">
  A full-stack web application for managing shared mess/house meal operations — tracking meals, expenses, deposits, menus, and member coordination.
</p>

<p align="center">
  <a href="https://meal-management-system-alpha.vercel.app/">Live Demo</a>
</p>

---

## Features

- **Meal Tracking** — Log lunch/dinner meals with guest meal support
- **Bazar Expense Management** — Track shopping expenses and assign bazar duties
- **Deposit Management** — Monitor member deposits and balance
- **Menu Planning** — Set daily menus with automatic food image matching
- **Notice Board** — Targeted announcements (all/group/individual)
- **Freezer Stock** — Track freezer inventory
- **Excel Export** — Download monthly logs as spreadsheets
- **Multi-Mess Support** — Create, join, or switch between messes
- **Role Management** — Manager, moderator, and member roles
- **Dark Mode** — Full light/dark theme support
- **Mobile Responsive** — Optimized for mobile with bottom navigation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL / CockroachDB |
| Auth | Custom JWT (jose + bcryptjs) |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (or CockroachDB)

### 1. Clone & Install

```bash
git clone https://github.com/tamalchakrovorty/MealManagementSystem.git
cd MealManagementSystem
npm install
```

### 2. Set Up Database

```bash
# Create database user and database
sudo -u postgres psql -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';"
sudo -u postgres psql -c "CREATE DATABASE mms OWNER mmsuser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mms TO mmsuser;"

# Import schema
PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f supabase/database-v5-dump.sql
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:

```
DATABASE_URL=postgresql://mmsuser:mmspass@localhost:5432/mms
JWT_SECRET=your-secret-key-here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Or use the one-command setup:** `bash setup.sh`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `SSL_CERT_PATH` | No | Path to SSL cert for CockroachDB |
| `ALLOWED_DEV_ORIGINS` | No | Comma-separated IPs for dev access |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register, find-account
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── homepage/        # Home with stats & announcements
│   │   └── dashboard/
│   │       ├── admin/       # Admin panel (meals, bazar, members, etc.)
│   │       └── user/        # User views (meals, deposits, reports)
│   └── api/                 # REST API routes
├── components/
│   ├── shared/              # Nav, theme toggle, info popup
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── auth.ts              # JWT authentication
    ├── db.ts                # Database connection
    ├── types.ts             # TypeScript types
    └── utils.ts             # Utility functions
```

## API

See [API.md](./API.md) for complete API documentation (40 endpoints).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.
