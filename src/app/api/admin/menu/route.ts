import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messId = searchParams.get("mess_id");
  const date = searchParams.get("date");

  if (!messId || !date) return NextResponse.json({ error: "mess_id and date required" }, { status: 400 });

  const auth = await requireMessMembership(messId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await query(
    `SELECT lunch, dinner FROM menus WHERE mess_id = $1 AND date = $2`,
    [messId, date]
  );

  const raw = (rows as any[])[0] || { lunch: "", dinner: "" };
  const menu = { lunch_menu: raw.lunch || "", dinner_menu: raw.dinner || "" };
  return NextResponse.json({ menu });
}

export async function POST(request: Request) {
  const { mess_id, date, lunch_menu, dinner_menu } = await request.json();
  if (!mess_id || !date) return NextResponse.json({ error: "mess_id and date required" }, { status: 400 });

  const auth = await requireMessMembership(mess_id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await query(
    `INSERT INTO menus (mess_id, date, lunch, dinner)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (mess_id, date)
     DO UPDATE SET lunch = EXCLUDED.lunch, dinner = EXCLUDED.dinner`,
    [mess_id, date, lunch_menu || "", dinner_menu || ""]
  );

  return NextResponse.json({ success: true });
}
