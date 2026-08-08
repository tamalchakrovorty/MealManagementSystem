import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";
import { invalidateTags } from "@/lib/server-cache";

export async function PATCH(request: Request) {
  const { id, mess_id, message } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const notice = await queryOne(
    `SELECT message FROM notices WHERE id = $1 AND mess_id = $2`,
    [id, mess_id]
  );

  if (notice) {
    await query(
       `UPDATE notifications SET message = $1, edited_at = NOW(), read_at = NULL
       WHERE mess_id = $2 AND type IN ('announcement', 'group_notice', 'personal_notice') AND message = $3`,
      [message, mess_id, (notice as any).message]
    );

    const members = await query(
      `SELECT user_id FROM memberships WHERE mess_id = $1 AND status = 'active'`,
      [mess_id]
    );
    for (const m of members) {
      await queryOne(
        `INSERT INTO notifications (user_id, mess_id, type, message, edited_at)
         SELECT $1, $2, 'announcement', $3, NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM notifications WHERE user_id = $1 AND mess_id = $2 AND message = $3
         )`,
        [(m as any).user_id, mess_id, message]
      );
    }
  }

  await queryOne(
    `UPDATE notices SET message = $1, edited_at = NOW() WHERE id = $2 AND mess_id = $3`,
    [message, id, mess_id]
  );

  invalidateTags(["notices", "notifications"]);

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const { mess_id, message, targetType, targetUserIds } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const user = auth.user!;

  await queryOne(
    `INSERT INTO notices (mess_id, author_id, message, target_type, target_user_ids)
     VALUES ($1, $2, $3, $4, $5)`,
    [mess_id, user.id, message, targetType || "all", targetUserIds || null]
  );

  if (targetType === "group" && targetUserIds?.length) {
    for (const uid of targetUserIds) {
      await queryOne(
        `INSERT INTO notifications (user_id, mess_id, type, message)
         VALUES ($1, $2, 'group_notice', $3)`,
        [uid, mess_id, message]
      );
    }
  } else if (targetType === "individual" && targetUserIds?.[0]) {
    await queryOne(
      `INSERT INTO notifications (user_id, mess_id, type, message)
       VALUES ($1, $2, 'personal_notice', $3)`,
      [targetUserIds[0], mess_id, message]
    );
  } else {
    const members = await query(
      `SELECT user_id FROM memberships WHERE mess_id = $1 AND status = 'active'`,
      [mess_id]
    );
    for (const m of members) {
      await queryOne(
        `INSERT INTO notifications (user_id, mess_id, type, message)
         VALUES ($1, $2, 'announcement', $3)`,
        [(m as any).user_id, mess_id, message]
      );
    }
  }

  invalidateTags(["notices", "notifications"]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id, mess_id } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const notice = await queryOne(
    `SELECT message, target_type FROM notices WHERE id = $1 AND mess_id = $2`,
    [id, mess_id]
  );

  if (!notice) return NextResponse.json({ error: "Notice not found" }, { status: 404 });

  const notifType = (notice as any).target_type === "group"
    ? "group_notice"
    : (notice as any).target_type === "individual"
      ? "personal_notice"
      : "announcement";

  await query(
    `DELETE FROM notifications WHERE mess_id = $1 AND type = $2 AND message = $3`,
    [mess_id, notifType, (notice as any).message]
  );

  await queryOne(
    `DELETE FROM notices WHERE id = $1 AND mess_id = $2`,
    [id, mess_id]
  );

  invalidateTags(["notices", "notifications"]);

  return NextResponse.json({ success: true });
}
