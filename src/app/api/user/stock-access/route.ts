import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { requireMessMembership } from "@/lib/auth";

export async function POST(request: Request) {
  const { messId } = await request.json();
  if (!messId) return NextResponse.json({ error: "Mess ID required" }, { status: 400 });

  const auth = await requireMessMembership(messId);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const user = auth.user!;

  const existing = await queryOne(
    "SELECT id FROM requests WHERE mess_id = $1 AND user_id = $2 AND type = 'stock_access' AND status = 'pending'",
    [messId, user.id]
  );

  if (existing) {
    return NextResponse.json({ error: "You already have a pending stock access request" }, { status: 409 });
  }

  await queryOne(
    "INSERT INTO requests (mess_id, user_id, type, status) VALUES ($1, $2, 'stock_access', 'pending')",
    [messId, user.id]
  );

  return NextResponse.json({ success: true });
}
