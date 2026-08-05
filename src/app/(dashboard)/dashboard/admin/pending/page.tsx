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
    <div className="space-y-4 max-w-lg mx-auto pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Pending</span>
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
