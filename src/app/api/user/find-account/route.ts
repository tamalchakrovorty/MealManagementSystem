import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, phone, newPassword } = await request.json();

  if (!email && !phone) {
    return NextResponse.json({ error: "Please enter email or phone number" }, { status: 400 });
  }

  let user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    mess_name: string | null;
  } | null = null;

  if (email && phone) {
    user = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, m.name AS mess_name
       FROM users u
       LEFT JOIN memberships ms ON ms.user_id = u.id AND ms.status = 'active'
       LEFT JOIN messes m ON m.id = ms.mess_id
       WHERE u.email = $1 AND u.phone = $2`,
      [email, phone]
    );
  } else if (email) {
    user = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, m.name AS mess_name
       FROM users u
       LEFT JOIN memberships ms ON ms.user_id = u.id AND ms.status = 'active'
       LEFT JOIN messes m ON m.id = ms.mess_id
       WHERE u.email = $1`,
      [email]
    );
  } else {
    user = await queryOne(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, m.name AS mess_name
       FROM users u
       LEFT JOIN memberships ms ON ms.user_id = u.id AND ms.status = 'active'
       LEFT JOIN messes m ON m.id = ms.mess_id
       WHERE u.phone = $1`,
      [phone]
    );
  }

  if (!user) {
    return NextResponse.json({ error: "No account found with these details" }, { status: 404 });
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    const passwordHash = await hashPassword(newPassword);
    await queryOne("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, user.id]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({
    found: true,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    messName: user.mess_name,
  });
}
