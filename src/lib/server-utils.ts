import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { Membership, Profile, Role } from "@/lib/types";

export const MESS_COOKIE = "mms_mess";

export async function getCurrentUser() {
  return getSessionUser();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return queryOne("SELECT * FROM profiles WHERE id = $1", [userId]);
}

export interface AccessibleMess {
  id: string;
  name: string;
  mess_code: string;
  role: Role;
  isCreator: boolean;
  joined_at: string | null;
  status: 'active' | 'left';
}

export async function getAccessibleMesses(userId: string): Promise<AccessibleMess[]> {
  const rows = await query(
    `SELECT m.id, m.name, m.mess_code, m.created_by, mem.role, mem.status, mem.joined_at
     FROM messes m
     LEFT JOIN memberships mem ON mem.mess_id = m.id AND mem.user_id = $1
     WHERE mem.status = 'active' OR mem.status = 'left' OR m.created_by = $1
     ORDER BY (mem.status = 'active') DESC, mem.joined_at ASC NULLS LAST, m.created_at ASC`,
    [userId]
  );
  return rows.map((r) => {
    const isCreator = r.created_by === userId;
    const role = r.status === "active" ? r.role : isCreator ? "manager" : r.role;
    return {
      id: r.id,
      name: r.name,
      mess_code: r.mess_code,
      role: (role || "manager") as Role,
      isCreator,
      joined_at: r.joined_at ?? null,
      status: (r.status || "active") as 'active' | 'left',
    };
  });
}

export async function getSelectedMembership(userId: string): Promise<Membership | null> {
  const cookieStore = await cookies();
  const selectedId = cookieStore.get(MESS_COOKIE)?.value;

  if (selectedId) {
    const row = await queryOne(
      "SELECT * FROM memberships WHERE user_id = $1 AND mess_id = $2 AND status = 'active'",
      [userId, selectedId]
    );
    if (row) return row as Membership;
  }

  if (selectedId) {
    const mess = await queryOne("SELECT created_by FROM messes WHERE id = $1", [selectedId]);
    if (mess?.created_by === userId) {
      const row = await queryOne(
        `UPDATE memberships SET status = 'active', role = 'manager'
         WHERE user_id = $1 AND mess_id = $2
         RETURNING *`,
        [userId, selectedId]
      );
      if (row) return row as Membership;
    }
  }

  return queryOne(
    "SELECT * FROM memberships WHERE user_id = $1 AND status = 'active' ORDER BY joined_at ASC LIMIT 1",
    [userId]
  ) as Promise<Membership | null>;
}

export async function getUserRole(messId: string, userId: string): Promise<Role | null> {
  const result = await queryOne<{ role: string }>(
    "SELECT role FROM memberships WHERE mess_id = $1 AND user_id = $2 AND status = 'active'",
    [messId, userId]
  );
  return result?.role as Role ?? null;
}

export async function requireRole(messId: string, userId: string, allowedRoles: Role[]): Promise<boolean> {
  const role = await getUserRole(messId, userId);
  return role !== null && allowedRoles.includes(role);
}
