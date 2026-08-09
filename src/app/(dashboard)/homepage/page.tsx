import { redirect } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { getMessInfo, getLatestNotice, getTodayMenu } from "@/lib/cached-queries";
import { CreateMessDialog } from "../dashboard/user/create-mess-dialog";
import Link from "next/link";
import { getFoodImage } from "@/lib/food-images";

export const dynamic = "force-dynamic";

interface Membership {
  id: string;
  user_id: string;
  mess_id: string;
  role: string;
  status: string;
}

export default async function HomepagePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);

  if (!membership) {
    return <NoMessView />;
  }

  const messId = membership.mess_id;

  const now = new Date();
  const mStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const mEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const today = format(new Date(), "yyyy-MM-dd");

  const [, latestNotice, todayMenu, totalMealsResult, totalExpensesResult, depositsResult, userMealsResult, negativeBalanceResult] =
    await Promise.all([
      getMessInfo(messId),
      getLatestNotice(messId),
      getTodayMenu(messId, today),
      queryOne("SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3", [messId, mStart, mEnd]),
      queryOne("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM bazar_expenses WHERE mess_id = $1 AND date >= $2 AND date <= $3", [messId, mStart, mEnd]),
      queryOne("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM deposits WHERE mess_id = $1 AND user_id = $2 AND date >= $3 AND date <= $4", [messId, user.id, mStart, mEnd]),
      queryOne("SELECT COALESCE(SUM(quantity), 0)::numeric AS total FROM meal_entries WHERE mess_id = $1 AND user_id = $2 AND date >= $3 AND date <= $4", [messId, user.id, mStart, mEnd]),
      queryOne(
        `SELECT COUNT(*)::int as count FROM (
          SELECT m.user_id,
            COALESCE(d.total_deposit, 0) - COALESCE(me.total_meals, 0) *
              NULLIF(COALESCE(te.total_expenses, 0), 0) / NULLIF(COALESCE(tm.total_meals, 0), 0) as balance
          FROM memberships m
          LEFT JOIN (
            SELECT user_id, SUM(amount) as total_deposit
            FROM deposits WHERE mess_id = $1 AND date >= $2 AND date <= $3 GROUP BY user_id
          ) d ON d.user_id = m.user_id
          LEFT JOIN (
            SELECT user_id, SUM(quantity) as total_meals
            FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3
            GROUP BY user_id
          ) me ON me.user_id = m.user_id
          CROSS JOIN (SELECT COALESCE(SUM(amount), 0) as total_expenses FROM bazar_expenses WHERE mess_id = $1 AND date >= $2 AND date <= $3) te
          CROSS JOIN (SELECT COALESCE(SUM(quantity), 0) as total_meals FROM meal_entries WHERE mess_id = $1 AND date >= $2 AND date <= $3) tm
          WHERE m.mess_id = $1 AND m.status = 'active'
        ) sub WHERE sub.balance < 0`,
        [messId, mStart, mEnd]
      ),
    ]);

  const totalMeals = Number((totalMealsResult as any)?.total || 0);
  const totalExpenses = Number((totalExpensesResult as any)?.total || 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const totalDeposit = Number((depositsResult as any)?.total || 0);
  const userMeals = Number((userMealsResult as any)?.total || 0);
  const userExpense = userMeals * mealRate;
  const balance = totalDeposit - userExpense;
  const negativeCount = (negativeBalanceResult as any)?.count || 0;

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto">
      {/* Notice Card - Purple Gradient */}
      <div className="rounded-[18px] p-5 md:p-6 text-white shadow-[0_10px_25px_rgba(108,99,255,.3)]" style={{ background: "linear-gradient(135deg, #6c63ff 0%, #8a7dff 100%)" }}>
        <div className="inline-flex items-center gap-1.5 bg-white/18 px-2.5 py-1 rounded-full text-[11px] mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M3 11L18 5V19L3 13V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M18 9C19.5 9.5 21 10.5 21 12C21 13.5 19.5 14.5 18 15" stroke="currentColor" strokeWidth="2" />
          </svg>
          Announcement
        </div>
        {latestNotice ? (
          <>
            <p className="text-[14px] md:text-[15px] leading-relaxed mb-4 text-white/92 line-clamp-3 md:line-clamp-none whitespace-pre-line">
              {(latestNotice as any).message}
            </p>
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                {(latestNotice as any).author_avatar ? (
                  <img src={(latestNotice as any).author_avatar} alt="" className="w-[28px] h-[28px] rounded-full object-cover" />
                ) : (
                  <div className="w-[28px] h-[28px] rounded-full bg-white/25 flex items-center justify-center text-[11px] font-bold">
                    {((latestNotice as any).author_name || "M").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[12px]">{(latestNotice as any).author_name || "Manager"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(latestNotice as any).edited_at && (
                  <span className="text-[9px] text-white/90 font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
                    edited
                  </span>
                )}
                <span className="text-[11px] opacity-85">
                  {format(new Date((latestNotice as any).created_at), "d MMM, yyyy")}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[13px] text-white/80">No recent notices</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Meal Rate Card */}
        <div className="bg-card rounded-[16px] p-3.5 md:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#4f8cff] flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 20L20 4M20 4H12M20 4V12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-1">Meal Rate</p>
          <p className="text-[22px] font-extrabold">৳{mealRate.toFixed(0)}</p>
        </div>

        {/* Balance Card */}
        <div className="bg-card rounded-[16px] p-3.5 md:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#22c55e] flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff" strokeWidth="1.8" />
              <path d="M8 8H16M8 12H16M8 16H12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-1">Balance</p>
          <p className={`text-[22px] font-extrabold ${balance < 0 ? "text-[#ef4444]" : ""}`}>৳{balance.toFixed(0)}</p>
        </div>

        {/* Estimated Deposit - Desktop only */}
        <div className="hidden md:block bg-card rounded-[16px] p-3.5 md:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f59e0b] flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="#fff" strokeWidth="1.8" />
              <path d="M2 9H22" stroke="#fff" strokeWidth="1.8" />
              <path d="M6 14H10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-1">Est. Deposit</p>
          <p className="text-[22px] font-extrabold text-[#ef4444]">৳{userExpense.toFixed(0)}</p>
        </div>

        {/* Negative Balance - Desktop only */}
        <div className="hidden md:block bg-card rounded-[16px] p-3.5 md:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#ef4444] flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.8" />
              <path d="M12 8V13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="#fff" />
            </svg>
          </div>
          <p className="text-[12px] font-semibold text-muted-foreground mb-1">Negative Balance</p>
          <p className={`text-[22px] font-extrabold ${negativeCount > 0 ? "text-[#ef4444]" : ""}`}>{negativeCount}</p>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-[17px] font-bold">Today&apos;s Menu</h2>
        <span className="text-[12px] text-[#888]">{format(new Date(), "d MMM")}</span>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {/* Today's Lunch */}
        <div className="bg-card rounded-[16px] p-3.5 md:p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold mb-1">Lunch</h3>
            <p className="text-[13px] text-muted-foreground leading-snug mb-1 max-w-[180px] line-clamp-2">
              {(todayMenu as any)?.lunch || "Not set"}
            </p>
            <small className="text-muted-foreground text-[11px]">{format(new Date(), "EEEE")}</small>
          </div>
            <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[14px] bg-muted shrink-0 overflow-hidden">
              <Image
                src={getFoodImage((todayMenu as any)?.lunch || "", 0)}
                alt="lunch"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
        </div>

        {/* Today's Dinner */}
        <div className="bg-card rounded-[16px] p-3.5 md:p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold mb-1">Dinner</h3>
            <p className="text-[13px] text-muted-foreground leading-snug mb-1 max-w-[180px] line-clamp-2">
              {(todayMenu as any)?.dinner || "Not set"}
            </p>
            <small className="text-muted-foreground text-[11px]">{format(new Date(), "EEEE")}</small>
          </div>
            <div className="w-[72px] h-[72px] md:w-[80px] md:h-[80px] rounded-[14px] bg-muted shrink-0 overflow-hidden">
              <Image
                src={getFoodImage((todayMenu as any)?.dinner || "", 1)}
                alt="dinner"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
        </div>
      </div>
    </div>
  );
}

async function NoMessView() {
  return (
    <div className="space-y-0 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-5 pb-2">
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Create / Join Mess</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Get started with your mess</p>
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
      <p className="text-center text-[15px] font-semibold text-foreground px-6 mb-7">
        You are not part of any mess yet.
      </p>

      {/* Buttons */}
      <div className="px-6 space-y-4">
        <CreateMessDialog />
        <Link
          href="/dashboard/join-mess"
          className="w-full bg-card text-primary border-[1.6px] border-[#d9d3f7] rounded-2xl py-4 text-[15.5px] font-bold flex items-center justify-center gap-2.5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M15 10L17 12L21 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Join Mess
        </Link>
      </div>
    </div>
  );
}
