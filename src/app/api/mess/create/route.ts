import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Mess name is required" }, { status: 400 });
  }

  const activeMembership = await queryOne(
    "SELECT id FROM memberships WHERE user_id = $1 AND status = 'active'",
    [user.id]
  );

  if (activeMembership) {
    return NextResponse.json({ error: "You must leave your current mess before joining another." }, { status: 400 });
  }

  let mess_code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await queryOne("SELECT id FROM messes WHERE mess_code = $1", [mess_code]);
    if (!existing) break;
    mess_code = generateCode();
    attempts++;
  }

  const mess = await queryOne(
    `INSERT INTO messes (name, mess_code, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [name, mess_code, user.id]
  );

  if (!mess) {
    return NextResponse.json({ error: "Failed to create mess" }, { status: 500 });
  }

  await queryOne(
    `INSERT INTO memberships (user_id, mess_id, role, status) VALUES ($1, $2, 'manager', 'active')`,
    [user.id, (mess as any).id]
  );

  return NextResponse.json({ mess });
}

export async function PUT() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const membership = await queryOne(
    "SELECT * FROM memberships WHERE user_id = $1 AND role = 'manager' AND status = 'active' LIMIT 1",
    [user.id]
  );
  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let mess_code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await queryOne("SELECT id FROM messes WHERE mess_code = $1", [mess_code]);
    if (!existing) break;
    mess_code = generateCode();
    attempts++;
  }

  const updated = await queryOne(
    "UPDATE messes SET mess_code = $1 WHERE id = $2 RETURNING mess_code",
    [mess_code, (membership as any).mess_id]
  );
  if (!updated) {
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }

  return NextResponse.json({ mess_code: (updated as any).mess_code });
}
