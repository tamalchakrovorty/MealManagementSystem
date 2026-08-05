import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messId = searchParams.get("messId");
  if (!messId) return NextResponse.json({ error: "messId required" }, { status: 400 });

  const auth = await requireMessMembership(messId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const contacts = await query(
    "SELECT id, name, category, phone, description FROM contacts WHERE mess_id = $1 ORDER BY sort_order, created_at",
    [messId]
  );
  return NextResponse.json(contacts);
}
