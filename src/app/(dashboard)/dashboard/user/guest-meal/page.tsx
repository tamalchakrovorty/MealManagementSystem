import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { GuestMealForm } from "./guest-meal-form";

export const dynamic = "force-dynamic";

export default async function GuestMealPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);

  if (!membership) redirect("/dashboard/user");

  const messId = (membership as any).mess_id;

  const members = await query(
    `SELECT m.user_id, p.name FROM memberships m
     LEFT JOIN profiles p ON p.id = m.user_id
     WHERE m.mess_id = $1 AND m.status = 'active' AND m.user_id != $2`,
    [messId, user.id]
  );

  return <GuestMealForm messId={messId} members={members || []} />;
}
