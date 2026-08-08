import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { invalidateTags } from "@/lib/server-cache";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { requestId, mess_id, userId } = await request.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingActive = await client.query(
      "SELECT id FROM memberships WHERE user_id = $1 AND status = 'active' AND mess_id != $2 LIMIT 1",
      [userId, mess_id]
    );
    if (existingActive.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "You must leave your current mess before joining another." }, { status: 400 });
    }

    await client.query(
      `UPDATE requests SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    const memberCount = await client.query(
      "SELECT COUNT(*)::int AS count FROM memberships WHERE mess_id = $1 AND status = 'active'",
      [mess_id]
    );
    const isEmpty = memberCount.rows[0]?.count === 0;

    let role = 'member';
    if (isEmpty) {
      const formerCheck = await client.query(
        "SELECT id FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'left'",
        [mess_id, userId]
      );
      role = formerCheck.rows.length > 0 ? 'manager' : 'member';
    }

    await client.query(
      `INSERT INTO memberships (user_id, mess_id, role, status) VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_id, mess_id) DO UPDATE SET status = 'active', role = $3`,
      [userId, mess_id, role]
    );

    await client.query("COMMIT");

    invalidateTags(["members", "memberships", "notifications"]);

    const profile = await client.query("SELECT name FROM profiles WHERE id = $1", [userId]);
    const userName = profile.rows[0]?.name || "A member";

    const members = await client.query(
      `SELECT user_id FROM memberships WHERE mess_id = $1 AND status = 'active' AND user_id != $2`,
      [mess_id, userId]
    );
    for (const m of members.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, mess_id, type, message) VALUES ($1, $2, 'join_accepted', $3)`,
        [m.user_id, mess_id, `${userName} has joined the mess.`]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
