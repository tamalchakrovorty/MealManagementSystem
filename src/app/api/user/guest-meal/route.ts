import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const validQty = [0, 0.5, 1];

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { messId, date, guests } = await request.json();

  if (!messId || !date || !Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const membership = await queryOne(
    "SELECT id FROM memberships WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
    [user.id, messId]
  );
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this mess" }, { status: 403 });
  }

  const existing = await queryOne(
    "SELECT id FROM requests WHERE mess_id = $1 AND user_id = $2 AND type = 'guest_meal' AND status = 'pending'",
    [messId, user.id]
  );
  if (existing) {
    return NextResponse.json({ error: "You already have a pending guest meal request" }, { status: 409 });
  }

  // Validate each guest
  for (const g of guests) {
    if (!g.name || !g.name.trim()) {
      return NextResponse.json({ error: "All guests must have a name" }, { status: 400 });
    }
    if (!validQty.includes(g.lunch) || !validQty.includes(g.dinner)) {
      return NextResponse.json({ error: "Invalid meal quantity" }, { status: 400 });
    }
    if (g.lunch === 0 && g.dinner === 0) {
      return NextResponse.json({ error: `${g.name} must have at least one meal (lunch or dinner)` }, { status: 400 });
    }
    if (!Array.isArray(g.shared_with)) {
      return NextResponse.json({ error: "Invalid shared_with data" }, { status: 400 });
    }
  }

  // Validate shared_with user IDs are active members of this mess
  const allSharedIds = [...new Set(guests.flatMap((g: any) => g.shared_with || []))];
  if (allSharedIds.length > 0) {
    const validMembers = await query(
      "SELECT user_id FROM memberships WHERE mess_id = $1 AND user_id = ANY($2) AND status = 'active'",
      [messId, allSharedIds]
    );
    const validIds = new Set(validMembers.map((m: any) => m.user_id));
    for (const sid of allSharedIds) {
      if (!validIds.has(sid)) {
        return NextResponse.json({ error: `User ${sid} is not an active member of this mess` }, { status: 400 });
      }
    }
  }

  const details = {
    date,
    guests: guests.map((g: any) => ({
      name: g.name.trim(),
      lunch: g.lunch,
      lunch_type: g.lunch_type || "full",
      dinner: g.dinner,
      dinner_type: g.dinner_type || "full",
      shared_with: g.shared_with || [],
    })),
  };

  await queryOne(
    `INSERT INTO requests (mess_id, user_id, type, status, details)
     VALUES ($1, $2, 'guest_meal', 'pending', $3)`,
    [messId, user.id, JSON.stringify(details)]
  );

  return NextResponse.json({ success: true });
}
