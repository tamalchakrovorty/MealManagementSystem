import { cache } from "react";
import { unstable_cache } from "next/cache";
import { query, queryOne } from "@/lib/db";

export const getMessInfo = cache(
  unstable_cache(
    async (messId: string) => {
      return queryOne("SELECT id, name FROM messes WHERE id = $1", [messId]);
    },
    ["mess-info"],
    { revalidate: 3600, tags: ["mess"] }
  )
);

export const getMessFull = cache(
  unstable_cache(
    async (messId: string) => {
      return queryOne("SELECT * FROM messes WHERE id = $1", [messId]);
    },
    ["mess-full"],
    { revalidate: 3600, tags: ["mess"] }
  )
);

export const getProfile = cache(
  unstable_cache(
    async (userId: string) => {
      return queryOne("SELECT * FROM profiles WHERE id = $1", [userId]);
    },
    ["profile"],
    { revalidate: 3600, tags: ["profile"] }
  )
);

export const getAccessibleMesses = cache(
  unstable_cache(
    async (userId: string) => {
      const rows = await query(
        `SELECT m.id, m.name, m.mess_code, m.created_by, mem.role, mem.status, mem.joined_at
         FROM messes m
         LEFT JOIN memberships mem ON mem.mess_id = m.id AND mem.user_id = $1
         WHERE mem.status = 'active' OR m.created_by = $1
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
          role: role || "manager",
          isCreator,
          joined_at: r.joined_at ?? null,
        };
      });
    },
    ["accessible-messes"],
    { revalidate: 1800, tags: ["memberships"] }
  )
);

export const getActiveMembers = cache(
  unstable_cache(
    async (messId: string) => {
      return query(
        `SELECT m.user_id, m.role, m.status, p.name, p.avatar_url FROM memberships m
         LEFT JOIN profiles p ON p.id = m.user_id
         WHERE m.mess_id = $1 AND m.status = 'active'`,
        [messId]
      );
    },
    ["active-members"],
    { revalidate: 300, tags: ["members"] }
  )
);

export const getUnreadCount = cache(
  unstable_cache(
    async (userId: string, messId: string) => {
      const result = await queryOne(
        "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL",
        [userId, messId]
      );
      return (result as any)?.count || 0;
    },
    ["unread-count"],
    { revalidate: 30, tags: ["notifications"] }
  )
);

export const getTodayMenu = cache(
  unstable_cache(
    async (messId: string, date: string) => {
      return queryOne("SELECT * FROM menus WHERE mess_id = $1 AND date = $2", [messId, date]);
    },
    ["today-menu"],
    { revalidate: 3600, tags: ["menus"] }
  )
);

export const getLatestNotice = cache(
  unstable_cache(
    async (messId: string) => {
      return queryOne(
        `SELECT n.*, p.name as author_name, p.avatar_url as author_avatar FROM notices n
         LEFT JOIN profiles p ON p.id = n.author_id
         WHERE n.mess_id = $1 AND n.target_type = 'all'
         ORDER BY COALESCE(n.edited_at, n.created_at) DESC LIMIT 1`,
        [messId]
      );
    },
    ["latest-notice"],
    { revalidate: 3600, tags: ["notices"] }
  )
);

export const getMonthlyTotals = cache(
  unstable_cache(
    async (messId: string, monthStart: string, monthEnd: string) => {
      const [totalMeals, totalExpenses] = await Promise.all([
        queryOne(
          "SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3",
          [messId, monthStart, monthEnd]
        ),
        queryOne(
          "SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM bazar_expenses WHERE mess_id = $1 AND date >= $2 AND date <= $3",
          [messId, monthStart, monthEnd]
        ),
      ]);
      return {
        totalMeals: Number((totalMeals as any)?.total || 0),
        totalExpenses: Number((totalExpenses as any)?.total || 0),
      };
    },
    ["monthly-totals"],
    { revalidate: 120, tags: ["totals"] }
  )
);
