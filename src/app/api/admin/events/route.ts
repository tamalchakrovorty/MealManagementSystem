import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No active mess" }, { status: 400 });

  const events = await query(
    `SELECT e.*, p.name as author_name FROM events e
     LEFT JOIN profiles p ON p.id = e.author_id
     WHERE e.mess_id = $1
     ORDER BY e.event_date DESC, e.created_at DESC`,
    [(membership as any).mess_id]
  );

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No active mess" }, { status: 400 });

  const { title, description, eventDate } = await request.json();
  if (!title || !eventDate) return NextResponse.json({ error: "Title and date required" }, { status: 400 });

  const messId = (membership as any).mess_id;

  const event = await queryOne(
    `INSERT INTO events (mess_id, author_id, title, description, event_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [messId, user.id, title, description || null, eventDate]
  );

  const members = await query(
    "SELECT user_id FROM memberships WHERE mess_id = $1 AND status = 'active'",
    [messId]
  );
  for (const m of members as any[]) {
    await queryOne(
      `INSERT INTO notifications (user_id, mess_id, type, message)
       VALUES ($1, $2, 'event', $3)`,
      [m.user_id, messId, `New event: ${title} on ${eventDate}`]
    );
  }

  return NextResponse.json(event);
}
