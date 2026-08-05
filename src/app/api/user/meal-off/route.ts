import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

const DATE_CONDITION = `(details->>'date' = $3 OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(details->'dates') d WHERE d = $3))`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const messId = searchParams.get("mess_id");
    const date = searchParams.get("date");

    if (!messId || !date) return NextResponse.json({ error: "mess_id and date required" }, { status: 400 });

    const auth = await requireMessMembership(messId);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const user = auth.user!;

    // Latest approved request for this date
    const approvedRow = await queryOne(
      `SELECT * FROM requests
       WHERE mess_id = $1 AND user_id = $2 AND type = 'meal_off' AND status = 'approved'
       AND ${DATE_CONDITION}
       ORDER BY created_at DESC LIMIT 1`,
      [messId, user.id, date]
    );

    // Any pending request for this date
    const pendingRow = await queryOne(
      `SELECT * FROM requests
       WHERE mess_id = $1 AND user_id = $2 AND type = 'meal_off' AND status = 'pending'
       AND ${DATE_CONDITION}
       ORDER BY created_at DESC LIMIT 1`,
      [messId, user.id, date]
    );

    const approvedDetails = approvedRow
      ? (typeof approvedRow.details === "string" ? JSON.parse(approvedRow.details) : approvedRow.details)
      : null;

    const pendingDetails = pendingRow
      ? (typeof pendingRow.details === "string" ? JSON.parse(pendingRow.details) : pendingRow.details)
      : null;

    const currentLunch = approvedDetails?.lunch || "on";
    const currentDinner = approvedDetails?.dinner || "on";

    const response: Record<string, any> = {
      currentLunch,
      currentDinner,
    };

    if (pendingRow) {
      response.requestStatus = "pending";
      response.pendingLunch = pendingDetails?.lunch || "on";
      response.pendingDinner = pendingDetails?.dinner || "on";
      const isCombined = Array.isArray(pendingDetails?.dates) && pendingDetails.dates.length > 0;
      response.partOfCombined = isCombined;
      if (isCombined) response.combinedDates = pendingDetails.dates;
    } else if (approvedRow) {
      response.requestStatus = "approved";
    } else {
      response.requestStatus = null;
    }

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { date, dates, mess_id, lunch, dinner } = await request.json();

    const allDates = dates?.length ? dates : date ? [date] : [];
    if (!allDates.length || !mess_id) {
      return NextResponse.json({ error: "date(s) and mess_id required" }, { status: 400 });
    }

    const auth = await requireMessMembership(mess_id);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const user = auth.user!;

    const validOptions = ["on", "off", "rice_only", "curry_only"];
    if (lunch && !validOptions.includes(lunch)) {
      return NextResponse.json({ error: "Invalid lunch option" }, { status: 400 });
    }
    if (dinner && !validOptions.includes(dinner)) {
      return NextResponse.json({ error: "Invalid dinner option" }, { status: 400 });
    }

    // Delete only pending requests for the affected dates
    for (const d of allDates) {
      await query(
        `DELETE FROM requests
         WHERE mess_id = $1 AND user_id = $2 AND type = 'meal_off' AND status = 'pending'
         AND (
           details->>'date' = $3
           OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(details->'dates') del WHERE del = $3)
         )`,
        [mess_id, user.id, d]
      );
    }

    // Always create a new pending request
    if (allDates.length > 3) {
      // Combined request for ranges > 3 days
      await query(
        `INSERT INTO requests (mess_id, user_id, type, status, details)
         VALUES ($1, $2, 'meal_off', 'pending', $3)`,
        [mess_id, user.id, JSON.stringify({ dates: allDates, lunch: lunch || "on", dinner: dinner || "on" })]
      );
    } else {
      // Individual requests for ≤ 3 days
      for (const d of allDates) {
        await query(
          `INSERT INTO requests (mess_id, user_id, type, status, details)
           VALUES ($1, $2, 'meal_off', 'pending', $3)`,
          [mess_id, user.id, JSON.stringify({ date: d, lunch: lunch || "on", dinner: dinner || "on" })]
        );
      }
    }

    return NextResponse.json({ success: true, action: "created", count: allDates.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}
