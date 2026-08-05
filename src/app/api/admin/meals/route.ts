import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser, requireMessMembership } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messId = searchParams.get("mess_id");
  const date = searchParams.get("date");
  const isGuest = searchParams.get("is_guest") || "false";
  const mealOffDate = searchParams.get("meal_off_date");

  if (!messId || !date) return NextResponse.json({ error: "mess_id and date required" }, { status: 400 });

  const auth = await requireMessMembership(messId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const user = auth.user;

  const rows = await query(
    `SELECT user_id, slot, quantity FROM meal_entries
     WHERE mess_id = $1 AND date = $2 AND is_guest = $3`,
    [messId, date, isGuest === "true"]
  );

  const meals: Record<string, { lunch: number; dinner: number }> = {};
  for (const r of rows as any[]) {
    if (!meals[r.user_id]) meals[r.user_id] = { lunch: 0, dinner: 0 };
    meals[r.user_id][r.slot as "lunch" | "dinner"] = Number(r.quantity);
  }

  let mealOffData: Record<string, { lunch: string; dinner: string }> = {};
  if (mealOffDate) {
    const offRows = await query(
      `SELECT user_id, details FROM requests
       WHERE mess_id = $1 AND type = 'meal_off' AND status = 'approved'
       AND (
         details->>'date' = $2
         OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(details->'dates') d WHERE d = $2)
       )`,
      [messId, mealOffDate]
    );
    for (const r of offRows as any[]) {
      const details = typeof r.details === "string" ? JSON.parse(r.details) : r.details;
      mealOffData[r.user_id] = {
        lunch: details?.lunch || "on",
        dinner: details?.dinner || "on",
      };
    }
  }

  return NextResponse.json({ meals, mealOffData });
}

export async function POST(request: Request) {
  const { entries } = await request.json();
  if (!entries?.length) return NextResponse.json({ error: "No entries" }, { status: 400 });

  const firstMessId = entries[0]?.mess_id;
  if (!firstMessId) return NextResponse.json({ error: "mess_id required" }, { status: 400 });

  const auth = await requireMessMembership(firstMessId, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const user = auth.user;

  let saved = 0;
  for (const e of entries) {
    try {
      if (e.quantity === 0) {
        await query(
          `DELETE FROM meal_entries WHERE mess_id = $1 AND user_id = $2 AND date = $3 AND slot = $4 AND is_guest = $5`,
          [e.mess_id, e.user_id, e.date, e.slot, e.is_guest || false]
        );
      } else {
        await query(
          `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mess_id, user_id, date, slot, is_guest)
           DO UPDATE SET quantity = EXCLUDED.quantity`,
          [e.mess_id, e.user_id, e.date, e.slot, e.quantity, e.is_guest || false]
        );
      }
      saved++;
    } catch (err: any) {
      console.error("Failed to save meal entry:", err.message);
    }
  }

  if (saved === 0) return NextResponse.json({ error: "Failed to save any entries" }, { status: 500 });
  return NextResponse.json({ success: true, count: saved });
}
