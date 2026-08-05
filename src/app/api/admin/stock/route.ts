import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function POST(request: Request) {
  const { mess_id, item, quantity, unit } = await request.json();

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `INSERT INTO freezer_stock (mess_id, item, quantity, unit) VALUES ($1, $2, $3, $4)`,
    [mess_id, item, quantity, unit || "kg"]
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { id, item, quantity, unit } = await request.json();

  const stockItem = await queryOne("SELECT mess_id FROM freezer_stock WHERE id = $1", [id]);
  if (!stockItem) return NextResponse.json({ error: "Stock item not found" }, { status: 404 });

  const auth = await requireMessMembership((stockItem as any).mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(
    `UPDATE freezer_stock SET item = $1, quantity = $2, unit = $3, updated_at = NOW() WHERE id = $4`,
    [item, quantity, unit || "kg", id]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  const stockItem = await queryOne("SELECT mess_id FROM freezer_stock WHERE id = $1", [id]);
  if (!stockItem) return NextResponse.json({ error: "Stock item not found" }, { status: 404 });

  const auth = await requireMessMembership((stockItem as any).mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await queryOne(`DELETE FROM freezer_stock WHERE id = $1`, [id]);

  return NextResponse.json({ success: true });
}
