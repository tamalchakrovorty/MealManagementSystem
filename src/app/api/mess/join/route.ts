import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: "Mess code is required" }, { status: 400 });
  }

  const mess = await queryOne(
    "SELECT id, name FROM messes WHERE mess_code = $1",
    [code.toUpperCase()]
  );

  if (!mess) {
    return NextResponse.json({ error: "Invalid mess code. No mess found." }, { status: 404 });
  }

  const existingRequest = await queryOne(
    "SELECT id FROM requests WHERE mess_id = $1 AND user_id = $2 AND type = 'join' AND status = 'pending'",
    [(mess as any).id, user.id]
  );

  if (existingRequest) {
    return NextResponse.json({ error: "You already have a pending request for this mess." }, { status: 409 });
  }

  const existingMembership = await queryOne(
    "SELECT id FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'active'",
    [(mess as any).id, user.id]
  );

  if (existingMembership) {
    return NextResponse.json({ error: "You are already a member of this mess." }, { status: 409 });
  }

  const activeMembership = await queryOne(
    "SELECT id FROM memberships WHERE user_id = $1 AND status = 'active'",
    [user.id]
  );

  if (activeMembership) {
    return NextResponse.json({ error: "You must leave your current mess before joining another." }, { status: 400 });
  }

  const pendingLeave = await queryOne(
    `SELECT id FROM requests WHERE user_id = $1 AND type = 'leave' AND status = 'pending'`,
    [user.id]
  );
  if (pendingLeave) {
    return NextResponse.json(
      { error: "You have a pending leave request. Please wait for it to be processed before joining another mess." },
      { status: 400 }
    );
  }

  const activeMemberCount = await queryOne(
    "SELECT COUNT(*)::int AS count FROM memberships WHERE mess_id = $1 AND status = 'active'",
    [(mess as any).id]
  );

  if ((activeMemberCount as any).count === 0) {
    const formerMember = await queryOne(
      "SELECT id FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'left'",
      [(mess as any).id, user.id]
    );

    if (!formerMember) {
      return NextResponse.json(
        { error: "This mess has no active members. Only former members can rejoin." },
        { status: 400 }
      );
    }

    await queryOne(
      `INSERT INTO memberships (user_id, mess_id, role, status) VALUES ($1, $2, 'manager', 'active')
       ON CONFLICT (user_id, mess_id) DO UPDATE SET role = 'manager', status = 'active'`,
      [(mess as any).id, user.id]
    );
    return NextResponse.json({ success: true, message: "You are now the manager of this mess." });
  }

  try {
    await queryOne(
      "INSERT INTO requests (mess_id, user_id, type, status) VALUES ($1, $2, 'join', 'pending')",
      [(mess as any).id, user.id]
    );
  } catch (err: any) {
    if (err?.code === "23503") {
      return NextResponse.json(
        { error: "Your account was not found. Please log out and log back in." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create join request" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
