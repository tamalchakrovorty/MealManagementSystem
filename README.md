<p align="center">
  <img src="public/icon.png" alt="MMS Logo" width="100" />
</p>

<h1 align="center">Mess Meal Management System (MMS)</h1>

<p align="center">
  A full-stack web application for managing shared mess/house meal operations — tracking meals, expenses, deposits, menus, and member coordination.
</p>

<p align="center">
  <a href="https://meal-management-system-alpha.vercel.app/">Live Demo</a> &nbsp;|&nbsp; <a href="docs/USER_GUIDE.md">User Guide / ব্যবহার নির্দেশিকা</a>
</p>

---

## Features / বৈশিষ্ট্য

| Feature | Description |
|---------|-------------|
| **Create & Join Mess** | Create your own mess or join with an invite code or QR scan |
| **Meal Tracking** | Log breakfast, lunch, dinner meals with guest meal support |
| **Meal Off/On** | Set your meal status per slot (on/off/rice only/curry only) |
| **Guest Meals** | Request guest meals for one or multiple days with cost sharing |
| **Menu Planning** | Set daily menus with automatic food image matching |
| **Bazar Expenses** | Track shopping expenses and assign bazar duties |
| **Deposits** | Monitor member deposits, expenses, and balances |
| **Reports & Export** | Download monthly logs as styled Excel spreadsheets |
| **Notice Board** | Targeted announcements (all/group/individual) with pin support |
| **Freezer Stock** | Track freezer inventory with access control |
| **Multi-Mess** | Create, join, or switch between multiple messes |
| **Roles** | Manager, moderator, and member roles with permissions |
| **Login Options** | Login with email or phone number |
| **Dark Mode** | Full light/dark/system theme support |
| **Mobile Ready** | Optimized for mobile with bottom navigation |

## Tech Stack / প্রযুক্তি

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL / CockroachDB |
| Auth | Custom JWT (jose + bcryptjs) |
| Export | ExcelJS |
| Icons | Lucide React |

## Quick Start / দ্রুত শুরু

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
sudo -u postgres psql -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';"
sudo -u postgres psql -c "CREATE DATABASE mms OWNER mmsuser;"
PGPASSWORD=mmspass psql -U mmsuser -h localhost -d mms -f supabase/database-v5-dump.sql
```

### 3. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
DATABASE_URL=postgresql://mmsuser:mmspass@localhost:5432/mms
JWT_SECRET=your-secret-key-here
```

### 4. Run
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL/CockroachDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |

## User Guide / ব্যবহার নির্দেশিকা

**For end users and admins:** See the full [User Guide (English + Bangla)](docs/USER_GUIDE.md) for step-by-step instructions on every feature.

## Project Structure
```
src/
├── app/
│   ├── (auth)/              # Login, register, forgot password
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── homepage/        # Home with stats & menu
│   │   └── dashboard/
│   │       ├── admin/       # Admin panel
│   │       └── user/        # User views
│   └── api/                 # REST API (~40 endpoints)
├── components/
│   ├── shared/              # Nav, theme toggle, popup
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── auth.ts              # JWT authentication
    ├── db.ts                # Database connection
    ├── types.ts             # TypeScript types
    └── export-log.ts        # Excel export
```

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
MIT License — see [LICENSE](./LICENSE).
