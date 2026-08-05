import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { messId } = await request.json();
  if (!messId) return NextResponse.json({ error: "Mess ID required" }, { status: 400 });

  const membership = await queryOne(
    "SELECT id, role FROM memberships WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
    [user.id, messId]
  );

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this mess" }, { status: 400 });
  }

  if ((membership as any).role === "manager") {
    const activeCount = await queryOne(
      "SELECT COUNT(*)::int AS count FROM memberships WHERE mess_id = $1 AND status = 'active'",
      [messId]
    );
    if ((activeCount as any).count > 1) {
      return NextResponse.json({ error: "Manager cannot leave while other members exist. Transfer managership first." }, { status: 400 });
    }
  }

  const existing = await queryOne(
    `SELECT id FROM requests WHERE mess_id = $1 AND user_id = $2 AND type = 'leave' AND status = 'pending'`,
    [messId, user.id]
  );
  if (existing) {
    return NextResponse.json({ error: "You already have a pending leave request" }, { status: 409 });
  }

  const depositsResult = await query(
    "SELECT amount FROM deposits WHERE mess_id = $1 AND user_id = $2",
    [messId, user.id]
  );
  const balance = depositsResult.reduce((s: number, d: any) => s + Number(d.amount), 0);

  await queryOne(
    `INSERT INTO requests (mess_id, user_id, type, status, details)
     VALUES ($1, $2, 'leave', 'pending', $3)`,
    [messId, user.id, JSON.stringify({ balance })]
  );

  const profile = await queryOne("SELECT name FROM profiles WHERE id = $1", [user.id]);
  const userName = (profile as any)?.name || "A member";

  const managers = await query(
    `SELECT user_id FROM memberships WHERE mess_id = $1 AND status = 'active' AND role IN ('manager', 'moderator')`,
    [messId]
  );
  for (const m of managers as any[]) {
    await queryOne(
      `INSERT INTO notifications (user_id, mess_id, type, message)
       VALUES ($1, $2, 'leave', $3)`,
      [m.user_id, messId, `${userName} has requested to leave the mess.`]
    );
  }

  return NextResponse.json({ success: true, message: "Leave request sent to the manager" });
}
