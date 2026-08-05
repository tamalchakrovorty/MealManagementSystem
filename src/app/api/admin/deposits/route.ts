import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

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
