import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  // Fetch Google user profile
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const googleUser = await userRes.json();
  if (!userRes.ok || !googleUser.email) {
    return NextResponse.redirect(`${origin}/login?error=failed_to_get_user`);
  }

  // Find existing user by email
  let user = await queryOne<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM users WHERE email = $1",
    [googleUser.email]
  );

  // Create new user if not found
  if (!user) {
    const randomPassword = randomBytes(32).toString("hex");
    const passwordHash = await hashPassword(randomPassword);
    const displayName = googleUser.name || googleUser.email.split("@")[0];

    user = await queryOne<{ id: string; email: string; name: string }>(
      `INSERT INTO users (email, password_hash, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name`,
      [googleUser.email, passwordHash, displayName, googleUser.picture || null]
    );

    if (user) {
      await queryOne(
        `INSERT INTO profiles (id, name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [user.id, displayName, googleUser.picture || null]
      );
    }
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=failed_to_create_user`);
  }

  // Create session and set cookie
  const token = await createSession({ id: user.id, email: user.email, name: user.name });

  const response = NextResponse.redirect(`${origin}/homepage`);
  response.cookies.set("mms_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
