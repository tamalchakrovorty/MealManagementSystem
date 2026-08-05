import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MESS_COOKIE } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { messId } = await request.json();
  if (!messId) return NextResponse.json({ error: "messId required" }, { status: 400 });

  const mess = await queryOne("SELECT id, name, created_by FROM messes WHERE id = $1", [messId]);
  if (!mess) return NextResponse.json({ error: "Mess not found" }, { status: 404 });

  const isCreator = (mess as any).created_by === user.id;

  const membership = await queryOne(
    "SELECT status FROM memberships WHERE user_id = $1 AND mess_id = $2",
    [user.id, messId]
  );

  if (isCreator) {
    await queryOne(
      `INSERT INTO memberships (user_id, mess_id, role, status)
       VALUES ($1, $2, 'manager', 'active')
       ON CONFLICT (user_id, mess_id) DO UPDATE SET role = 'manager', status = 'active'`,
      [user.id, messId]
    );
  } else if (membership && (membership as any).status === "active") {
    // active member of this mess: allow switch
  } else {
    return NextResponse.json({ error: "You don't have access to this mess" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(MESS_COOKIE, messId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ success: true, messId, name: (mess as any).name });
}
