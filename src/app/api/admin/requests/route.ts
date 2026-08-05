import { NextResponse } from "next/server";
import { query, queryOne, pool } from "@/lib/db";
import { getSessionUser, requireMessMembership } from "@/lib/auth";

export async function PUT(request: Request) {
  const { requestId, status } = await request.json();

  const req = await queryOne(
    "SELECT * FROM requests WHERE id = $1",
    [requestId]
  );
  if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // If leave request, only the manager can accept/reject
  if (req.type === "leave") {
    const auth = await requireMessMembership((req as any).mess_id, ["manager"]);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, requestId]
      );

      if (status === "approved") {
        await client.query(
          `UPDATE memberships SET status = 'left' WHERE user_id = $1 AND mess_id = $2`,
          [req.user_id, req.mess_id]
        );
        await client.query(
          `INSERT INTO notifications (user_id, mess_id, type, message)
           VALUES ($1, $2, 'leave', $3)`,
          [req.user_id, req.mess_id, `Your leave request has been approved. You are no longer a member of this mess.`]
        );
      } else if (status === "rejected") {
        await client.query(
          `INSERT INTO notifications (user_id, mess_id, type, message)
           VALUES ($1, $2, 'leave', $3)`,
          [req.user_id, req.mess_id, `Your leave request has been rejected.`]
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (err: any) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  // For non-leave requests, verify the caller is an admin of the mess
  const auth = await requireMessMembership((req as any).mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, requestId]
  );

  // Supersede older approved meal_off requests when a new one is approved
  if (status === "approved" && req.type === "meal_off" && req.details) {
    const details = typeof req.details === "string" ? JSON.parse(req.details) : req.details;
    const dates: string[] = details.dates || (details.date ? [details.date] : []);
    if (dates.length > 0) {
      await query(
        `UPDATE requests SET status = 'rejected', updated_at = NOW()
         WHERE mess_id = $1 AND user_id = $2 AND type = 'meal_off' AND status = 'approved'
         AND id != $3
         AND (
           details->>'date' = ANY($4::text[])
            OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(details->'dates') d
                       WHERE d = ANY($4::text[]))
         )`,
        [req.mess_id, req.user_id, requestId, dates]
      );
    }
  }

  // Notify user about meal_off/meal_on approval or rejection
  if ((req.type === "meal_off" || req.type === "meal_on") && (status === "approved" || status === "rejected")) {
    const label = req.type === "meal_off" ? "Meal OFF" : "Meal ON";
    const action = status === "approved" ? "approved" : "rejected";
    await queryOne(
      `INSERT INTO notifications (user_id, mess_id, type, message)
       VALUES ($1, $2, 'meal_request_accepted', $3)`,
      [req.user_id, req.mess_id, `Your ${label} request has been ${action}.`]
    );
  }

  // If guest meal request is approved, create meal_entries
  if (status === "approved" && req.type === "guest_meal" && req.details) {
    const details = typeof req.details === "string" ? JSON.parse(req.details) : req.details;
    const guests: any[] = details.guests || [];
    for (const guest of guests) {
      const lunch = Number(guest.lunch || 0);
      const dinner = Number(guest.dinner || 0);
      const sharedWith: string[] = guest.shared_with || [];
      const totalPeople = 1 + sharedWith.length;

      if (lunch > 0 || dinner > 0) {
        const dividedLunch = lunch > 0 ? Number((lunch / totalPeople).toFixed(2)) : 0;
        const dividedDinner = dinner > 0 ? Number((dinner / totalPeople).toFixed(2)) : 0;

        // Meal entry for the requester
        if (dividedLunch > 0) {
          await query(
            `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
             VALUES ($1, $2, $3, 'lunch', $4, true)`,
            [req.mess_id, req.user_id, details.date, dividedLunch]
          );
        }
        if (dividedDinner > 0) {
          await query(
            `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
             VALUES ($1, $2, $3, 'dinner', $4, true)`,
            [req.mess_id, req.user_id, details.date, dividedDinner]
          );
        }

        // Meal entries for each shared member
        for (const memberId of sharedWith) {
          if (dividedLunch > 0) {
            await query(
              `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
               VALUES ($1, $2, $3, 'lunch', $4, true)`,
              [req.mess_id, memberId, details.date, dividedLunch]
            );
          }
          if (dividedDinner > 0) {
            await query(
              `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
               VALUES ($1, $2, $3, 'dinner', $4, true)`,
              [req.mess_id, memberId, details.date, dividedDinner]
            );
          }
        }
      }
    }
  }

  // Notify user about guest_meal approval or rejection
  if (req.type === "guest_meal" && (status === "approved" || status === "rejected")) {
    const action = status === "approved" ? "approved" : "rejected";
    await queryOne(
      `INSERT INTO notifications (user_id, mess_id, type, message)
       VALUES ($1, $2, 'guest_meal_accepted', $3)`,
      [req.user_id, req.mess_id, `Your guest meal request has been ${action}.`]
    );
  }

  return NextResponse.json({ success: true });
}
