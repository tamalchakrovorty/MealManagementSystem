import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const messId = url.searchParams.get("mess_id");
  if (!messId) return NextResponse.json({ error: "mess_id required" }, { status: 400 });

  const auth = await requireMessMembership(messId, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const deposits = await query(
    `SELECT d.id, d.user_id, d.amount, d.date, d.created_at, p.name, p.avatar_url
     FROM deposits d
     LEFT JOIN profiles p ON p.id = d.user_id
     WHERE d.mess_id = $1
     ORDER BY d.date DESC, d.created_at DESC
     LIMIT 100`,
    [messId]
  );

  return NextResponse.json({ deposits });
}

export async function POST(request: Request) {
  const { mess_id, user_id, amount, date } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `INSERT INTO deposits (mess_id, user_id, amount, date) VALUES ($1, $2, $3, $4)`,
    [mess_id, user_id, amount, date]
  );

  return NextResponse.json({ success: true });
}
