import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { NotificationsClient } from "./notifications-client";

interface NegativeUser {
  id: string;
  name: string;
  balance: number;
  avatar_url: string | null;
}

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);

  const messId = (membership as any)?.mess_id;

  const notifications = messId
    ? await query(
        `SELECT n.*, 
          (SELECT au.name FROM notices no2
           LEFT JOIN profiles au ON au.id = no2.author_id
           WHERE no2.mess_id = n.mess_id AND no2.message = n.message
           LIMIT 1) as author_name,
          (SELECT array_agg(DISTINCT p.name) FROM notices no2
           LEFT JOIN profiles p ON p.id = ANY(no2.target_user_ids)
           WHERE no2.mess_id = n.mess_id AND no2.message = n.message AND no2.target_type = 'group'
           LIMIT 1) as recipient_names
         FROM notifications n
         WHERE n.mess_id = $1 AND n.user_id = $2
         ORDER BY COALESCE(n.edited_at, n.created_at) DESC`,
        [messId, user.id]
      )
    : [];

  if (messId) {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL",
      [user.id, messId]
    );
  }

  const events = messId
    ? await query(
        `SELECT e.*, p.name as author_name FROM events e
         LEFT JOIN profiles p ON p.id = e.author_id
         WHERE e.mess_id = $1
         ORDER BY e.event_date DESC`,
        [messId]
      )
    : [];

  const bazarDuties = messId
    ? await query(
        `SELECT bd.*, p.name as user_name FROM bazar_duties bd
         LEFT JOIN profiles p ON p.id = bd.user_id
         WHERE bd.mess_id = $1
         ORDER BY bd.assigned_date DESC`,
        [messId]
      )
    : [];

  const negativeUsers: NegativeUser[] = [];
  if (messId) {
    const [mealData, depositData, expenseData, profilesData] = await Promise.all([
      query("SELECT user_id, quantity FROM meal_entries WHERE mess_id = $1 AND is_guest = false", [messId]),
      query("SELECT user_id, amount FROM deposits WHERE mess_id = $1", [messId]),
      query("SELECT amount FROM bazar_expenses WHERE mess_id = $1", [messId]),
      query(
        `SELECT m.user_id, p.name, p.avatar_url FROM memberships m
         LEFT JOIN profiles p ON p.id = m.user_id
         WHERE m.mess_id = $1 AND m.status = 'active'`,
        [messId]
      ),
    ]);

    const totalExpenses = expenseData.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalMeals = mealData.reduce((s: number, m: any) => s + Number(m.quantity), 0);
    const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

    const userMap = new Map<string, number>();
    for (const m of mealData) {
      userMap.set(m.user_id, (userMap.get(m.user_id) || 0) + Number(m.quantity));
    }

    const depositMap = new Map<string, number>();
    for (const d of depositData) {
      depositMap.set(d.user_id, (depositMap.get(d.user_id) || 0) + Number(d.amount));
    }

    const profileMap = new Map<string, { name: string; avatar_url: string | null }>();
    for (const p of profilesData) {
      profileMap.set(p.user_id, { name: p.name || "Unknown", avatar_url: p.avatar_url || null });
    }

    for (const [uid, meals] of userMap) {
      const deposit = depositMap.get(uid) || 0;
      const expense = meals * mealRate;
      const balance = deposit - expense;
      if (balance < 0) {
        const profile = profileMap.get(uid) || { name: "Unknown", avatar_url: null };
        negativeUsers.push({
          id: uid,
          name: profile.name,
          balance,
          avatar_url: profile.avatar_url,
        });
      }
    }

    negativeUsers.sort((a, b) => a.balance - b.balance);
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Link href="/homepage" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-lg font-bold">Notifications</span>
      </div>

      <Suspense>
        <NotificationsClient
          notifications={notifications || []}
          events={events || []}
          bazarDuties={bazarDuties || []}
          negativeUsers={negativeUsers}
          currentUserId={user.id}
        />
      </Suspense>
    </div>
  );
}
