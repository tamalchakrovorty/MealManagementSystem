import { NextResponse } from "next/server";
import { queryOne, pool } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function PUT(request: Request) {
  const { mess_id, userId, role, moderatorFrom, moderatorUntil, action } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "transfer_manager") {
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "Cannot transfer managership to yourself" }, { status: 400 });
    }

    const targetMember = await queryOne(
      `SELECT user_id FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'active'`,
      [mess_id, userId]
    );
    if (!targetMember) {
      return NextResponse.json({ error: "Target user is not an active member of this mess" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE memberships SET role = 'member', moderator_from = NULL, moderator_until = NULL WHERE mess_id = $1 AND user_id = $2`,
        [mess_id, auth.user.id]
      );
      await client.query(
        `UPDATE memberships SET role = 'manager' WHERE mess_id = $1 AND user_id = $2`,
        [mess_id, userId]
      );
      await client.query("COMMIT");
    } catch (err: any) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }

    return NextResponse.json({ success: true });
  }

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
