import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

interface ContactRow {
  id: string;
  mess_id: string;
  name: string;
  category: string;
  phone: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messId = searchParams.get("messId");
  if (!messId) return NextResponse.json({ error: "messId required" }, { status: 400 });

  const auth = await requireMessMembership(messId, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const contacts = await query(
    "SELECT * FROM contacts WHERE mess_id = $1 ORDER BY sort_order, created_at",
    [messId]
  );
  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const { mess_id, name, category, phone, description } = await request.json();
  if (!mess_id || !name || !phone) {
    return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
  }

  const auth = await requireMessMembership(mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const maxOrder = await queryOne(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM contacts WHERE mess_id = $1",
    [mess_id]
  );

  const contact = await queryOne(
    `INSERT INTO contacts (mess_id, name, category, phone, description, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [mess_id, name, category || "General", phone, description || null, (maxOrder as Record<string, number>).next_order]
  );

  return NextResponse.json(contact);
}

export async function PUT(request: Request) {
  const { id, name, category, phone, description, sort_order } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await queryOne("SELECT * FROM contacts WHERE id = $1", [id]) as ContactRow | null;
  if (!existing) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const auth = await requireMessMembership(existing.mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const contact = await queryOne(
    `UPDATE contacts SET name = $1, category = $2, phone = $3, description = $4, sort_order = $5
     WHERE id = $6 RETURNING *`,
    [name, category, phone, description || null, sort_order ?? existing.sort_order, id]
  );

  return NextResponse.json(contact);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await queryOne("SELECT * FROM contacts WHERE id = $1", [id]) as ContactRow | null;
  if (!existing) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const auth = await requireMessMembership(existing.mess_id, ["manager", "moderator"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await query("DELETE FROM contacts WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
