import Link from "next/link";
import { getAdminContext, getMembers } from "../_lib/helpers";
import { query } from "@/lib/db";
import { MembersListClient } from "./members-client";

export default async function MembersPage() {
  const { user, messId, membership } = await getAdminContext();
  const isManager = (membership as any).role === "manager";
  const [members, leaveRequests, mealsData, depositsData, expenseData] = await Promise.all([
    getMembers(messId),
    query(
      `SELECT r.*, p.name, p.phone, p.avatar_url FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'leave' AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query("SELECT user_id, quantity FROM meal_entries WHERE mess_id = $1 AND is_guest = false", [messId]),
    query("SELECT user_id, amount FROM deposits WHERE mess_id = $1", [messId]),
    query("SELECT amount FROM bazar_expenses WHERE mess_id = $1", [messId]),
  ]);

  const totalExpenses = (expenseData as any[]).reduce((s, e) => s + Number(e.amount), 0);
  const totalMeals = (mealsData as any[]).reduce((s, m) => s + Number(m.quantity), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

  const userMeals = new Map<string, number>();
  for (const m of mealsData as any[]) userMeals.set(m.user_id, (userMeals.get(m.user_id) || 0) + Number(m.quantity));

  const userDeposits = new Map<string, number>();
  for (const d of depositsData as any[]) userDeposits.set(d.user_id, (userDeposits.get(d.user_id) || 0) + Number(d.amount));

  const memberStats = new Map<string, { meals: number; deposits: number; balance: number }>();
  for (const m of members as any[]) {
    const meals = userMeals.get(m.user_id) || 0;
    const deposits = userDeposits.get(m.user_id) || 0;
    memberStats.set(m.user_id, { meals, deposits, balance: deposits - meals * mealRate });
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Members</span>
      </div>
      <MembersListClient
        members={members || []}
        leaveRequests={leaveRequests || []}
        mealRate={mealRate}
        memberStats={Object.fromEntries(memberStats)}
        currentUserId={user.id}
        isManager={isManager}
      />
    </div>
  );
}
