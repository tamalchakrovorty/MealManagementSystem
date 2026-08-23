import { NextResponse } from "next/server";
import { query, pool } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";
import { invalidateTags } from "@/lib/server-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messId = searchParams.get("mess_id");
  const date = searchParams.get("date");
  const isGuest = searchParams.get("is_guest") || "false";
  const mealOffDate = searchParams.get("meal_off_date");

  if (!messId || !date) return NextResponse.json({ error: "mess_id and date required" }, { status: 400 });

  const auth = await requireMessMembership(messId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await query(
    `SELECT user_id, slot, quantity FROM meal_entries
     WHERE mess_id = $1 AND date = $2 AND is_guest = $3`,
    [messId, date, isGuest === "true"]
  );

  const meals: Record<string, { breakfast: number; lunch: number; dinner: number }> = {};
  for (const r of rows as any[]) {
    if (!meals[r.user_id]) meals[r.user_id] = { breakfast: 0, lunch: 0, dinner: 0 };
    meals[r.user_id][r.slot as "breakfast" | "lunch" | "dinner"] = Number(r.quantity);
  }

  let mealOffData: Record<string, { breakfast: string; lunch: string; dinner: string }> = {};
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
        breakfast: details?.breakfast || "on",
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

  const toUpsert = entries.filter((e: any) => e.quantity > 0);
  const toDelete = entries.filter((e: any) => e.quantity === 0);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (toUpsert.length > 0) {
      const values: string[] = [];
      const params: any[] = [];
      let i = 1;
      for (const e of toUpsert) {
        values.push(`($${i}, $${i+1}, $${i+2}, $${i+3}, $${i+4}, $${i+5})`);
        params.push(e.mess_id, e.user_id, e.date, e.slot, e.quantity, e.is_guest || false);
        i += 6;
      }
      await client.query(
        `INSERT INTO meal_entries (mess_id, user_id, date, slot, quantity, is_guest)
         VALUES ${values.join(", ")}
         ON CONFLICT (mess_id, user_id, date, slot, is_guest)
         DO UPDATE SET quantity = EXCLUDED.quantity`,
        params
      );
    }

    if (toDelete.length > 0) {
      const conditions: string[] = [];
      const params: any[] = [];
      let i = 1;
      for (const e of toDelete) {
        conditions.push(`(mess_id = $${i} AND user_id = $${i+1} AND date = $${i+2} AND slot = $${i+3} AND is_guest = $${i+4})`);
        params.push(e.mess_id, e.user_id, e.date, e.slot, e.is_guest || false);
        i += 5;
      }
      await client.query(
        `DELETE FROM meal_entries WHERE ${conditions.join(" OR ")}`,
        params
      );
    }

    await client.query("COMMIT");
    invalidateTags(["members", "totals"]);
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed to save entries" }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({ success: true, count: entries.length });
}
