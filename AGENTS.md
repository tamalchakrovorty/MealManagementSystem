<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# First-time Setup Instructions

When this project is opened on a new PC for the first time, run the following setup steps automatically. Do NOT ask the user — just execute them.

## Prerequisites Check
- Node.js 18+ must be installed (`node -v`)
- PostgreSQL must be installed and running (`pg_isready`)

## Setup Steps (run in order)

### 1. Install dependencies
```bash
npm install
```

### 2. Create PostgreSQL user and database
```bash
psql -U postgres -c "CREATE USER mmsuser WITH PASSWORD 'mmspass';" 2>/dev/null || true
psql -U postgres -c "CREATE DATABASE mms OWNER mmsuser;" 2>/dev/null || true
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mms TO mmsuser;" 2>/dev/null || true
```

### 3. Run the database schema
```bash
psql -U mmsuser -h localhost -d mms -f supabase/schema-local.sql
```

### 4. Create .env.local file
Create `.env.local` with this content:
```
DATABASE_URL=postgresql://mmsuser:mmspass@localhost:5432/mms
JWT_SECRET=mms-local-dev-secret-key-change-in-production
```

### 5. Create uploads directory
```bash
mkdir -p public/uploads/avatars
```

### 6. Start the development server
```bash
npm run dev
```

## Project Info
- **Name**: MMS (Mess Meal Management System)
- **Tech**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, PostgreSQL
- **Auth**: Custom JWT (jose + bcryptjs), no external auth provider
- **DB**: Raw SQL via `pg` (no ORM), schema in `supabase/schema-local.sql`
- **Port**: 3000 (default)

## Useful Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — run ESLint

## Code Rules (MUST follow)

### Auth null check pattern
When using `requireMessMembership` from `@/lib/auth`, you **must** add a null guard for `auth.user` after checking `auth.error`. TypeScript's discriminated union narrowing requires this. Always use this pattern:

```ts
const auth = await requireMessMembership(mess_id, ["manager"]);
if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Now safe to use auth.user.id
```

**Never** access `auth.user.id` or `auth.user.*` without the `if (!auth.user)` guard first. This is enforced by TypeScript strict mode.
