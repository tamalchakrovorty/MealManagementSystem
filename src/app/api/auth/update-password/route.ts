import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { userId, newPassword } = await request.json();

  if (!userId || !newPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await queryOne("UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id", [passwordHash, userId]);

  return NextResponse.json({ success: true });
}
