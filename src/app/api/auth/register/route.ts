import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password, name, phone } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
  }

  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await queryOne<{ id: string; email: string; name: string }>(
    `INSERT INTO users (email, password_hash, name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name`,
    [email, passwordHash, name, phone || null]
  );

  if (!user) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  await queryOne(
    `INSERT INTO profiles (id, name, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [user.id, name, phone || null]
  );

  const token = await createSession({ id: user.id, email: user.email, name: user.name });
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
