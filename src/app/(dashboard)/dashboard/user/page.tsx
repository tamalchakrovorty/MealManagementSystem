import { redirect } from "next/navigation";
import Link from "next/link";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership, getAccessibleMesses } from "@/lib/server-utils";
import { UserActions } from "./user-actions";
import { UserSwitchMess } from "./user-switch-mess";
import { CreateMessDialog } from "./create-mess-dialog";
import { JoinMessDialog } from "./join-mess-dialog";

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, membership, accessibleMesses] = await Promise.all([
    queryOne("SELECT * FROM profiles WHERE id = $1", [user.id]),
    getSelectedMembership(user.id),
    getAccessibleMesses(user.id),
  ]);

  if (!membership) {
    return <NoMessView profile={profile} action={action} />;
  }

  const messId = (membership as any).mess_id;
  const isManagerOrModerator =
    (membership as any).role === "manager" || (membership as any).role === "moderator";

  const [mess, totalDepositResult, totalUserMealsResult, totalGuestMealsResult, allExpensesResult, totalMealsResult] = await Promise.all([
    queryOne("SELECT * FROM messes WHERE id = $1", [messId]),
    queryOne("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM deposits WHERE mess_id = $1 AND user_id = $2", [messId, user.id]),
    queryOne("SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND user_id = $2 AND is_guest = false", [messId, user.id]),
    queryOne("SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND user_id = $2 AND is_guest = true", [messId, user.id]),
    queryOne("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM bazar_expenses WHERE mess_id = $1", [messId]),
    queryOne("SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND is_guest = false", [messId]),
  ]);

  const totalExpenses = Number((allExpensesResult as any)?.total || 0);
  const totalMeals = Number((totalMealsResult as any)?.total || 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const totalDeposit = Number((totalDepositResult as any)?.total || 0);
  const totalUserMeals = Number((totalUserMealsResult as any)?.total || 0);
  const userExpense = totalUserMeals * mealRate;
  const balance = totalDeposit - userExpense;

  const daysLeft = (() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const estimatedDeposit = daysLeft * 2 * 2 - balance;

  return (
    <div className="space-y-4 max-w-lg md:max-w-4xl mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between pt-3 pb-1">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-[#1e2130] leading-tight">Dashboard</h1>
          <p className="text-[13px] md:text-[15px] text-[#8b8fa3]">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-[16px] p-1.5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
        <Link
          href="/dashboard/user"
          className="flex-1 text-center py-2.5 md:py-3 rounded-[12px] text-[13px] md:text-[15px] font-bold bg-[#6a4fd8] text-white shadow-sm"
        >
          User Dashboard
        </Link>
        {isManagerOrModerator && (
          <Link
            href="/dashboard/admin"
            className="flex-1 text-center py-2.5 md:py-3 rounded-[12px] text-[13px] md:text-[15px] font-bold text-[#8b8fa3]"
          >
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Profile & Mess Row */}
      <div className="md:grid md:grid-cols-[1fr_auto] md:gap-4 md:items-stretch space-y-4 md:space-y-0">
        {/* Profile Card */}
        <div className="bg-white rounded-[18px] p-4 md:p-5 flex items-center gap-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
          {(profile as any)?.avatar_url ? (
            <img
              src={(profile as any).avatar_url}
              alt={(profile as any)?.name || "User"}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover bg-[#ddd] shrink-0"
            />
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#6a4fd8] flex items-center justify-center text-xl md:text-2xl font-bold text-white shrink-0">
              {((profile as any)?.name?.charAt(0)?.toUpperCase() || "U")}
            </div>
          )}
          <div>
            <div className="text-[15px] md:text-[17px] font-bold">{(profile as any)?.name || "User"}</div>
            <div className="text-[12.5px] md:text-[14px] text-[#777] leading-snug">{user.email}</div>
            {(profile as any)?.phone && (
              <div className="text-[12.5px] md:text-[14px] text-[#777]">{(profile as any).phone}</div>
            )}
          </div>
        </div>

        {/* Switch Mess */}
        {accessibleMesses.length > 1 && (
          <UserSwitchMess
            messes={accessibleMesses}
            currentMessId={messId}
            currentMessName={(mess as any)?.name || "Mess"}
            currentRole={(membership as any)?.role || "member"}
          />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
          <div className="text-[12px] md:text-[13px] text-[#8b8fa3] font-semibold mb-2.5">Total Deposit</div>
          <div className="text-[18px] md:text-[22px] font-extrabold text-[#1fae70] mb-2">৳ {totalDeposit.toFixed(0)}</div>
          <Link href="/dashboard/user/views/deposits" className="text-[12px] md:text-[13px] font-semibold text-[#1fae70]">
            View History →
          </Link>
        </div>
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
          <div className="text-[12px] md:text-[13px] text-[#8b8fa3] font-semibold mb-2.5">Total Expense</div>
          <div className="text-[18px] md:text-[22px] font-extrabold text-[#e5484d]">৳ {userExpense.toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
          <div className="text-[12px] md:text-[13px] text-[#8b8fa3] font-semibold mb-2.5">Current Balance</div>
          <div className={`text-[18px] md:text-[22px] font-extrabold ${balance < 0 ? "text-[#e5484d]" : "text-[#1fae70]"}`}>
            ৳ {balance.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
          <div className="text-[12px] md:text-[13px] text-[#8b8fa3] font-semibold mb-2.5">Estimated Deposit</div>
          <div className={`text-[18px] md:text-[22px] font-extrabold ${balance < 0 ? "text-[#e5484d]" : "text-[#2f6fed]"}`}>
            ৳ {estimatedDeposit.toFixed(0)}
          </div>
          <div className={`mt-1.5 text-[10px] md:text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block ${
            balance < 0 ? "bg-[#ffe9ee] text-[#e5484d]" : "bg-[#e4f1ff] text-[#2f6fed]"
          }`}>
            {balance < 0 ? "Have to Pay" : "Surplus"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <UserActions profile={profile} messId={messId} />
    </div>
  );
}

async function NoMessView({ profile, action }: { profile: any; action?: string }) {
  return (
    <div className="space-y-0 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-5 pb-2">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-[#1e2130] leading-tight">Create / Join Mess</h1>
          <p className="text-[13px] md:text-[15px] text-[#8b8fa3]">Get started with your mess</p>
        </div>
      </div>

      {/* Illustration */}
      <div className="px-6 py-4">
        <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <circle cx="70" cy="90" r="17" fill="#e8a878" />
          <path d="M53 88C53 77 60 70 70 70C80 70 87 77 87 88" fill="#2a2015" />
          <rect x="52" y="102" width="36" height="55" rx="10" fill="#8a8a94" />
          <path d="M78 108L98 90" stroke="#e8a878" strokeWidth="10" strokeLinecap="round" />
          <circle cx="115" cy="82" r="17" fill="#f0b088" />
          <path d="M98 80C98 69 105 62 115 62C125 62 132 69 132 80" fill="#3a2a1e" />
          <rect x="97" y="94" width="36" height="60" rx="10" fill="#5a9270" />
          <path d="M124 100L142 84" stroke="#f0b088" strokeWidth="10" strokeLinecap="round" />
          <circle cx="160" cy="98" r="18" fill="#f0b088" />
          <path d="M142 96C142 84 150 76 160 76C170 76 178 84 178 96" fill="#2a2015" />
          <rect x="141" y="112" width="38" height="60" rx="10" fill="#3a4f8f" />
          <circle cx="205" cy="82" r="17" fill="#c98a5c" />
          <path d="M188 80C188 69 195 62 205 62C215 62 222 69 222 80" fill="#1a1410" />
          <rect x="187" y="94" width="36" height="60" rx="10" fill="#3a6b4a" />
          <path d="M196 100L178 84" stroke="#c98a5c" strokeWidth="10" strokeLinecap="round" />
          <circle cx="250" cy="90" r="17" fill="#e8a878" />
          <path d="M233 88C233 77 240 70 250 70C260 70 267 77 267 88" fill="#2a2015" />
          <rect x="232" y="102" width="36" height="55" rx="10" fill="#e0b04a" />
          <path d="M242 108L222 90" stroke="#e8a878" strokeWidth="10" strokeLinecap="round" />
        </svg>
      </div>

      {/* Message */}
      <p className="text-center text-[15px] font-semibold text-[#333] px-6 mb-7">
        You are not part of any mess yet.
      </p>

      {/* Buttons */}
      <div className="px-6 space-y-4">
        <CreateMessDialog defaultOpen={action === "create"} />
        <JoinMessDialog defaultOpen={action === "join"} />
      </div>
    </div>
  );
}
