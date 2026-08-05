import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function PUT(request: Request) {
  const { mess_id, userId, role, moderatorFrom, moderatorUntil } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (role === "moderator" && moderatorFrom && moderatorUntil) {
    await queryOne(
      `UPDATE memberships SET role = $1, moderator_from = $2, moderator_until = $3 WHERE mess_id = $4 AND user_id = $5`,
      [role, moderatorFrom, moderatorUntil, mess_id, userId]
    );
  } else if (role === "moderator") {
    await queryOne(
      `UPDATE memberships SET role = $1, moderator_from = NULL, moderator_until = NULL WHERE mess_id = $2 AND user_id = $3`,
      [role, mess_id, userId]
    );
  } else {
    await queryOne(
      `UPDATE memberships SET role = $1, moderator_from = NULL, moderator_until = NULL WHERE mess_id = $2 AND user_id = $3`,
      [role, mess_id, userId]
    );
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const { mess_id, userId, type, message } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `INSERT INTO notifications (user_id, mess_id, type, message) VALUES ($1, $2, $3, $4)`,
    [userId, mess_id, type, message]
  );

  return NextResponse.json({ success: true });
}
