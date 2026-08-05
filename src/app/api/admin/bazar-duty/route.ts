import { NextResponse } from "next/server";
import { format } from "date-fns";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No active mess" }, { status: 400 });

  const duties = await query(
    `SELECT bd.*, p.name as user_name, p.avatar_url
     FROM bazar_duties bd
     LEFT JOIN profiles p ON p.id = bd.user_id
     WHERE bd.mess_id = $1
     ORDER BY bd.assigned_date DESC, bd.created_at DESC`,
    [(membership as any).mess_id]
  );

  return NextResponse.json(duties);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No active mess" }, { status: 400 });
  if ((membership as any).role !== "manager" && (membership as any).role !== "moderator") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { userId, assignedDate } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const messId = (membership as any).mess_id;

  const existing = await queryOne(
    `SELECT id FROM bazar_duties WHERE mess_id = $1 AND user_id = $2 AND assigned_date = $3 AND status = 'pending'`,
    [messId, userId, assignedDate || new Date().toISOString().split("T")[0]]
  );
  if (existing) return NextResponse.json({ error: "Already assigned for this date" }, { status: 409 });

  const duty = await queryOne(
    `INSERT INTO bazar_duties (mess_id, user_id, assigned_date)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [messId, userId, assignedDate || new Date().toISOString().split("T")[0]]
  );

  const assignerProfile = await queryOne("SELECT name FROM profiles WHERE id = $1", [user.id]);
  const assignerName = (assignerProfile as any)?.name || "Admin";
  const targetProfile = await queryOne("SELECT name FROM profiles WHERE id = $1", [userId]);
  const targetName = (targetProfile as any)?.name || "Member";
  const rawDate = (duty as any).assigned_date;
  const dateObj = typeof rawDate === "string" ? new Date(rawDate + "T00:00:00") : rawDate;
  const dateFormatted = format(dateObj, "EEE, d MMM yyyy");

  await queryOne(
    `INSERT INTO notifications (user_id, mess_id, type, message)
     VALUES ($1, $2, 'assigned_bazar', $3)`,
    [userId, messId, `${assignerName} has assigned ${targetName} bazar duty on ${dateFormatted}.`]
  );

  return NextResponse.json(duty);
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No active mess" }, { status: 400 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await queryOne(
    `UPDATE bazar_duties SET status = 'completed', completed_at = NOW() WHERE id = $1 AND mess_id = $2`,
    [id, (membership as any).mess_id]
  );

  return NextResponse.json({ success: true });
}
