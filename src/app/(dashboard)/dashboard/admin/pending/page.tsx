import Link from "next/link";
import { getAdminContext } from "../_lib/helpers";
import { query } from "@/lib/db";
import { PendingClient } from "./pending-client";

export default async function PendingPage() {
  const { messId } = await getAdminContext();

  const [
    leaveRequests,
    joinRequests,
    overdueBazarDuties,
    mealOffRequests,
    guestMealRequests,
    missingMealDays,
  ] = await Promise.all([
    query(
      `SELECT r.*, p.name, p.avatar_url FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'leave' AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query(
      `SELECT r.*, p.name FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'join' AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query(
      `SELECT bd.*, p.name, p.avatar_url FROM bazar_duties bd
       LEFT JOIN profiles p ON p.id = bd.user_id
       WHERE bd.mess_id = $1 AND bd.status = 'pending' AND bd.assigned_date < CURRENT_DATE
       ORDER BY bd.assigned_date DESC`,
      [messId]
    ),
    query(
      `SELECT r.*, p.name FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type IN ('meal_off', 'meal_on') AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query(
      `SELECT r.*, p.name FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'guest_meal' AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query(
      `SELECT d.day::date AS date FROM generate_series(
         (SELECT COALESCE(MIN(joined_at)::date, CURRENT_DATE - INTERVAL '30 days') FROM memberships WHERE mess_id = $1),
         CURRENT_DATE - 1,
         '1 day'
       ) AS d(day)
       WHERE NOT EXISTS (
         SELECT 1 FROM meal_entries me WHERE me.mess_id = $1 AND me.date = d.day::date
       )
       ORDER BY d.day DESC`,
      [messId]
    ),
  ]);

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-5 pb-2">
        <Link
          href="/dashboard/admin"
          className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Pending</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Items requiring attention</p>
        </div>
      </div>
      <PendingClient
        leaveRequests={leaveRequests || []}
        joinRequests={joinRequests || []}
        overdueBazarDuties={overdueBazarDuties || []}
        mealOffRequests={mealOffRequests || []}
        guestMealRequests={guestMealRequests || []}
        missingMealDays={missingMealDays || []}
      />
    </div>
  );
}
