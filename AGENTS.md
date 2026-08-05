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

---

## Host PC Database Migrations

After pulling the latest code on the host PC, check this section for pending database migrations. Each migration must be run **once** on the host database.

### How to run a migration
```bash
psql -U mmsuser -h localhost -d mms -f <migration_file>
```
Or copy-paste the SQL into `psql` directly.

---

### Migration 1: Restore Tamal as Manager of Libya House ✅ COMPLETED

**When**: After pulling code that includes the transfer-manager fix. The host DB may have zero managers if a transfer was attempted before the fix.

**Why**: The old transfer code made two sequential API calls. The first demoted the manager, the second failed — leaving no manager in the mess.

**User IDs (host DB)**:
- Tamal chakroborty: `5b032632-dc3d-4353-acd5-21b75b9650e3`
- Libya House mess: `a4d863e3-6dbd-468d-bea1-be3b7df5aedd`

```sql
DO $$
DECLARE
  v_user_id UUID := '5b032632-dc3d-4353-acd5-21b75b9650e3';
  v_mess_id UUID := 'a4d863e3-6dbd-468d-bea1-be3b7df5aedd';
  v_current_role TEXT;
  v_current_status TEXT;
BEGIN
  SELECT role, status INTO v_current_role, v_current_status
  FROM memberships WHERE user_id = v_user_id AND mess_id = v_mess_id;

  RAISE NOTICE 'Before: role=%, status=%', v_current_role, v_current_status;

  IF v_current_role IS DISTINCT FROM 'manager' OR v_current_status IS DISTINCT FROM 'active' THEN
    UPDATE memberships
    SET role = 'manager', status = 'active',
        moderator_from = NULL, moderator_until = NULL
    WHERE user_id = v_user_id AND mess_id = v_mess_id;
    RAISE NOTICE 'Updated: Tamal is now manager (active)';
  ELSE
    RAISE NOTICE 'Already correct — no change needed';
  END IF;
END $$;

-- Verify result
SELECT p.name, m.role, m.status, ms.name AS mess_name
FROM memberships m
LEFT JOIN profiles p ON p.id = m.user_id
LEFT JOIN messes ms ON ms.id = m.mess_id
WHERE p.name ILIKE '%tamal%';
```

**Expected output**: Tamal should show `role = manager, status = active` for Libya House.
