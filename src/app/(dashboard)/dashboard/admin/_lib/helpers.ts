import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export async function getAdminContext() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership || !["manager", "moderator"].includes(membership.role)) redirect("/homepage");

  return { user, messId: (membership as any).mess_id as string, membership };
}

export async function getMembers(messId: string) {
  return query(
    `SELECT m.*, p.name, p.phone, p.avatar_url FROM memberships m
     LEFT JOIN profiles p ON p.id = m.user_id
     WHERE m.mess_id = $1 AND m.status = 'active'`,
    [messId]
  );
}

export async function getPendingMembers(messId: string) {
  return query(
    `SELECT m.*, p.name, p.phone FROM memberships m
     LEFT JOIN profiles p ON p.id = m.user_id
     WHERE m.mess_id = $1 AND m.status = 'pending'`,
    [messId]
  );
}
