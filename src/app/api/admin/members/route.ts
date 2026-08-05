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

export async function DELETE(request: Request) {
  const { mess_id, userId } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userId === auth.user.id) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  const member = await queryOne(
    `SELECT user_id FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'active'`,
    [mess_id, userId]
  );
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await queryOne(
    `UPDATE memberships SET status = 'left' WHERE mess_id = $1 AND user_id = $2`,
    [mess_id, userId]
  );

  await queryOne(
    `INSERT INTO notifications (user_id, mess_id, type, message) VALUES ($1, $2, 'removed', $3)`,
    [userId, mess_id, "You have been removed from the mess by the manager."]
  );

  return NextResponse.json({ success: true });
}
