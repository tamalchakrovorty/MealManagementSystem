import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ unreadCount: 0 });

  const result = await queryOne(
    "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL",
    [user.id, (membership as any).mess_id]
  );

  return NextResponse.json({ unreadCount: (result as any)?.count || 0 }, {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const membership = await getSelectedMembership(user.id);
  if (!membership) return NextResponse.json({ success: true });

  const { notificationIds } = await request.json().catch(() => ({}));

  if (notificationIds?.length) {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL AND id = ANY($3)",
      [user.id, (membership as any).mess_id, notificationIds]
    );
  } else {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL",
      [user.id, (membership as any).mess_id]
    );
  }

  return NextResponse.json({ success: true });
}
