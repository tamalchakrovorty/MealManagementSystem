import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, phone, avatar_url } = await request.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  await queryOne("UPDATE profiles SET name = $1, phone = $2, avatar_url = $3 WHERE id = $4", [name, phone || null, avatar_url || null, user.id]);
  await queryOne("UPDATE users SET name = $1, phone = $2, avatar_url = $3 WHERE id = $4", [name, phone || null, avatar_url || null, user.id]);

  return NextResponse.json({ success: true });
}
