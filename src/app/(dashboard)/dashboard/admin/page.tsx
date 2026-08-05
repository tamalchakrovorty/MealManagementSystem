import { redirect } from "next/navigation";
import { AdminDashboardClient } from "./admin-client";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

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

  const [mess, memberCountResult, pendingJoinResult, pendingMealResult, pendingGuestResult, pendingLeaveResult, overdueBazarResult, missingDaysResult, contactCountResult] =
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
           (SELECT COALESCE(MIN(joined_at)::date, CURRENT_DATE - INTERVAL '30 days') FROM memberships WHERE mess_id = $1),
           CURRENT_DATE - 1,
           '1 day'
         ) AS d(day)
         WHERE NOT EXISTS (
           SELECT 1 FROM meal_entries me WHERE me.mess_id = $1 AND me.date = d.day::date
         )`,
        [messId]
      ),
      queryOne(`SELECT COUNT(*)::int AS count FROM contacts WHERE mess_id = $1`, [messId]),
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
    />
  );
}
