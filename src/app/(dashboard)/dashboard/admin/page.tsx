import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-client";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);

  if (
    !membership ||
    ((membership as any).role !== "manager" && (membership as any).role !== "moderator")
  ) {
    redirect("/homepage");
  }

  const messId = (membership as any).mess_id;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [mess, memberCountResult, pendingJoinResult, pendingMealResult, pendingGuestResult, pendingLeaveResult, overdueBazarResult, missingDaysResult, contactCountResult, totalDepositsResult, totalExpensesResult, totalMealsResult, perMemberResult] =
    await Promise.all([
      queryOne("SELECT id, name FROM messes WHERE id = $1", [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM memberships WHERE mess_id = $1 AND status = 'active'`, [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM requests WHERE mess_id = $1 AND type = 'join' AND status = 'pending'`, [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM requests WHERE mess_id = $1 AND type IN ('meal_off', 'meal_on') AND status = 'pending'`, [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM requests WHERE mess_id = $1 AND type = 'guest_meal' AND status = 'pending'`, [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM requests WHERE mess_id = $1 AND type = 'leave' AND status = 'pending'`, [messId]),
      queryOne(`SELECT COUNT(*)::int AS count FROM bazar_duties WHERE mess_id = $1 AND status = 'pending' AND assigned_date < CURRENT_DATE`, [messId]),
      queryOne(
        `SELECT COUNT(*)::int AS count FROM generate_series(
           CURRENT_DATE - INTERVAL '7 days',
           CURRENT_DATE - 1,
           '1 day'
         ) AS d(day)
         WHERE NOT EXISTS (
           SELECT 1 FROM meal_entries me WHERE me.mess_id = $1 AND me.date = d.day::date
         )`,
        [messId]
      ),
      queryOne(`SELECT COUNT(*)::int AS count FROM contacts WHERE mess_id = $1`, [messId]),
      queryOne(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM deposits WHERE mess_id = $1 AND date >= $2 AND date <= $3`, [messId, monthStart, monthEnd]),
      queryOne(`SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM bazar_expenses WHERE mess_id = $1 AND date >= $2 AND date <= $3`, [messId, monthStart, monthEnd]),
      queryOne(`SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3`, [messId, monthStart, monthEnd]),
      query(
        `SELECT m.user_id, m.status, p.name, p.avatar_url,
                COALESCE(me.meals, 0)::numeric AS meals,
                COALESCE(d.deposits, 0)::numeric AS deposits
         FROM memberships m
         LEFT JOIN profiles p ON p.id = m.user_id
         LEFT JOIN (
          SELECT user_id, SUM(quantity) AS meals
          FROM meal_entries
          WHERE mess_id = $1 AND date >= $2 AND date <= $3
          GROUP BY user_id
         ) me ON me.user_id = m.user_id
         LEFT JOIN (
           SELECT user_id, SUM(amount) AS deposits
           FROM deposits
           WHERE mess_id = $1 AND date >= $2 AND date <= $3
           GROUP BY user_id
         ) d ON d.user_id = m.user_id
         WHERE m.mess_id = $1`,
        [messId, monthStart, monthEnd]
      ),
    ]);

  const memberCount = (memberCountResult as any)?.count || 0;
  const pendingJoinCount = (pendingJoinResult as any)?.count || 0;
  const pendingMealCount = (pendingMealResult as any)?.count || 0;
  const pendingGuestCount = (pendingGuestResult as any)?.count || 0;
  const pendingLeaveCount = (pendingLeaveResult as any)?.count || 0;
  const overdueBazarCount = (overdueBazarResult as any)?.count || 0;
  const missingDaysCount = (missingDaysResult as any)?.count || 0;
  const totalPendingCount = pendingJoinCount + pendingMealCount + pendingGuestCount + pendingLeaveCount + overdueBazarCount + missingDaysCount;
  const contactCount = (contactCountResult as any)?.count || 0;
  const totalDeposits = Number((totalDepositsResult as any)?.total || 0);
  const totalExpenses = Number((totalExpensesResult as any)?.total || 0);
  const totalMeals = Number((totalMealsResult as any)?.total || 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const availableCash = totalDeposits - totalExpenses;

  const managerShouldCollect = (perMemberResult as any[]).reduce((sum: number, row: any) => {
    const memberMeals = Number(row.meals || 0);
    const memberDeposits = Number(row.deposits || 0);
    const balance = memberDeposits - memberMeals * mealRate;
    return balance < 0 ? sum + Math.abs(balance) : sum;
  }, 0);

  const daysLeft = (() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const totalEstimatedCollection = (perMemberResult as any[]).reduce((sum: number, row: any) => {
    const memberMeals = Number(row.meals || 0);
    const memberDeposits = Number(row.deposits || 0);
    const balance = memberDeposits - memberMeals * mealRate;
    const estimatedRemainingCost = daysLeft * 2 * mealRate;
    const estimated = Math.max(0, estimatedRemainingCost - balance);
    return sum + estimated;
  }, 0);

  const negativeBalanceMembers = (perMemberResult as any[])
    .map((row: any) => {
      const memberMeals = Number(row.meals || 0);
      const memberDeposits = Number(row.deposits || 0);
      const balance = memberDeposits - memberMeals * mealRate;
      return {
        user_id: row.user_id,
        name: row.name || "Unknown",
        avatar_url: row.avatar_url || null,
        balance,
        status: row.status || "active",
      };
    })
    .filter((m) => m.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  const estimatedCollectionMembers = (perMemberResult as any[])
    .map((row: any) => {
      const memberMeals = Number(row.meals || 0);
      const memberDeposits = Number(row.deposits || 0);
      const balance = memberDeposits - memberMeals * mealRate;
      const estimatedRemainingCost = daysLeft * 2 * mealRate;
      const amount = Math.max(0, estimatedRemainingCost - balance);
      return {
        user_id: row.user_id,
        name: row.name || "Unknown",
        avatar_url: row.avatar_url || null,
        balance,
        amount,
        status: row.status || "active",
      };
    })
    .filter((m) => m.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <AdminDashboardClient
      mess={mess}
      membership={membership}
      memberCount={memberCount}
      totalPendingCount={totalPendingCount}
      pendingJoinCount={pendingJoinCount}
      pendingMealCount={pendingMealCount}
      pendingGuestCount={pendingGuestCount}
      contactCount={contactCount}
      availableCash={availableCash}
      managerShouldCollect={managerShouldCollect}
      totalEstimatedCollection={totalEstimatedCollection}
      negativeBalanceMembers={negativeBalanceMembers}
      estimatedCollectionMembers={estimatedCollectionMembers}
    />
  );
}
