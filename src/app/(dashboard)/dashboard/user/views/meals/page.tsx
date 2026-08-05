import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { MonthPicker } from "../report/month-picker";
import { MealsViewClient } from "./meals-view-client";

export default async function MealsViewPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const month = params.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const messId = (membership as any).mess_id;

  const mealEntries = await query(
    `SELECT me.*, p.name as member_name FROM meal_entries me
     LEFT JOIN profiles p ON p.id = me.user_id
     WHERE me.mess_id = $1 AND TO_CHAR(me.date, 'YYYY-MM') = $2
     ORDER BY me.date DESC`,
    [messId, month]
  );

  return (
    <div className="min-h-screen" style={{ background: "#eef0fb" }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <Link
            href="/dashboard/user/views"
            className="w-[46px] h-[46px] min-w-[46px] bg-white rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1e2130" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[22px] font-extrabold text-[#1e2130] leading-tight">Daily Meals</h1>
            <p className="text-[13px] text-[#8b8fa3]">View meal entries</p>
          </div>
        </div>

        {/* Month Picker */}
        <div className="px-5 pt-2 pb-1">
          <MonthPicker currentMonth={month} />
        </div>

        {/* Content */}
        <div className="px-5 pt-3 pb-8">
          <MealsViewClient entries={mealEntries || []} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
