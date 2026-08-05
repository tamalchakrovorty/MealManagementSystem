import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function POST(request: Request) {
  const { mess_id, user_id, amount, date, notes } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `INSERT INTO bazar_expenses (mess_id, user_id, amount, date, notes) VALUES ($1, $2, $3, $4, $5)`,
    [mess_id, user_id, amount, date, notes || null]
  );

  await queryOne(
    `UPDATE bazar_duties SET status = 'completed', completed_at = NOW()
     WHERE mess_id = $1 AND user_id = $2 AND assigned_date = $3 AND status = 'pending'`,
    [mess_id, user_id, date]
  );

  return NextResponse.json({ success: true });
}
