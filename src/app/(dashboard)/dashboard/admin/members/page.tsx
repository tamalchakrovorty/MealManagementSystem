import Link from "next/link";
import { getAdminContext } from "../_lib/helpers";
import { query } from "@/lib/db";
import { MembersListClient } from "./members-client";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { user, messId, membership } = await getAdminContext();
  const isManager = (membership as any).role === "manager";

  const now = new Date();
  const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const mEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const [activeMembers, leaveRequests, rejectedLeaveRequests, mealsData, depositsData, expenseData, leftMembersRaw, removedUserIds] = await Promise.all([
    query(
      `SELECT m.*, p.name, p.phone, p.avatar_url FROM memberships m
       LEFT JOIN profiles p ON p.id = m.user_id
       WHERE m.mess_id = $1 AND m.status = 'active'`,
      [messId]
    ),
    query(
      `SELECT r.*, p.name, p.phone, p.avatar_url FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'leave' AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [messId]
    ),
    query(
      `SELECT r.*, p.name, p.phone, p.avatar_url FROM requests r
       LEFT JOIN profiles p ON p.id = r.user_id
       WHERE r.mess_id = $1 AND r.type = 'leave' AND r.status = 'rejected'
       ORDER BY r.updated_at DESC`,
      [messId]
    ),
    query("SELECT user_id, quantity FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3", [messId, mStart, mEnd]),
    query("SELECT user_id, amount FROM deposits WHERE mess_id = $1 AND date >= $2 AND date <= $3", [messId, mStart, mEnd]),
    query("SELECT amount FROM bazar_expenses WHERE mess_id = $1 AND date >= $2 AND date <= $3", [messId, mStart, mEnd]),
    query(
      `SELECT m.*, p.name, p.phone, p.avatar_url FROM memberships m
       LEFT JOIN profiles p ON p.id = m.user_id
       WHERE m.mess_id = $1 AND m.status = 'left'`,
      [messId]
    ),
    query(
      `SELECT DISTINCT user_id FROM notifications WHERE mess_id = $1 AND type = 'removed'`,
      [messId]
    ),
  ]);

  const removedIds = new Set((removedUserIds as any[]).map((r) => r.user_id));
  const leftMembers: any[] = [];
  const removedMembers: any[] = [];
  for (const m of leftMembersRaw as any[]) {
    if (removedIds.has(m.user_id)) {
      removedMembers.push(m);
    } else {
      leftMembers.push(m);
    }
  }

  const totalExpenses = (expenseData as any[]).reduce((s, e) => s + Number(e.amount), 0);
  const totalMeals = (mealsData as any[]).reduce((s, m) => s + Number(m.quantity), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

  const userMeals = new Map<string, number>();
  for (const m of mealsData as any[]) userMeals.set(m.user_id, (userMeals.get(m.user_id) || 0) + Number(m.quantity));

  const userDeposits = new Map<string, number>();
  for (const d of depositsData as any[]) userDeposits.set(d.user_id, (userDeposits.get(d.user_id) || 0) + Number(d.amount));

  const memberStats = new Map<string, { meals: number; deposits: number; balance: number }>();
  for (const m of activeMembers as any[]) {
    const meals = userMeals.get(m.user_id) || 0;
    const deposits = userDeposits.get(m.user_id) || 0;
    memberStats.set(m.user_id, { meals, deposits, balance: deposits - meals * mealRate });
  }

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
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Members</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Manage mess members</p>
        </div>
      </div>
      <MembersListClient
        members={activeMembers || []}
        leftMembers={leftMembers || []}
        removedMembers={removedMembers || []}
        leaveRequests={leaveRequests || []}
        rejectedLeaveRequests={rejectedLeaveRequests || []}
        mealRate={mealRate}
        memberStats={Object.fromEntries(memberStats)}
        currentUserId={user.id}
        isManager={isManager}
      />
    </div>
  );
}
