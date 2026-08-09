import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { format, eachDayOfInterval } from "date-fns";
import { MonthPicker } from "./month-picker";
import { MealRateGraph } from "./meal-rate-graph";

export const dynamic = "force-dynamic";

const badgeColors = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-[#e3faf0] dark:bg-[#1a3d2a]", text: "text-[#1bbf7e] dark:text-[#4dd99a]" },
  { bg: "bg-[#fff2df] dark:bg-[#4a3520]", text: "text-[#f2a03d] dark:text-[#f0b060]" },
  { bg: "bg-[#e4f1ff] dark:bg-[#1e3456]", text: "text-[#3fa6ec] dark:text-[#6baaff]" },
];

export default async function ReportViewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const defaultMonth = format(now, "yyyy-MM");
  let currentMonth = params.month || defaultMonth;

  // Validate month format (yyyy-MM)
  const monthMatch = currentMonth.match(/^(\d{4})-(\d{1,2})$/);
  let year: number, month: number;
  if (monthMatch) {
    year = parseInt(monthMatch[1]);
    month = parseInt(monthMatch[2]);
    if (month < 1 || month > 12) {
      currentMonth = defaultMonth;
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
  } else {
    currentMonth = defaultMonth;
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthLabel = format(new Date(year, month - 1, 1), "d MMM, yyyy");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const messId = (membership as any).mess_id;

  const [members, mealsResult, depositsResult, expensesResult, dailyExpenses, dailyMeals] = await Promise.all([
    query(
      `SELECT m.user_id, m.role, p.name, p.avatar_url FROM memberships m
       LEFT JOIN profiles p ON p.id = m.user_id
       WHERE m.mess_id = $1
         AND (
           m.status = 'active'
           OR EXISTS (
             SELECT 1 FROM meal_entries me WHERE me.user_id = m.user_id AND me.mess_id = $1 AND me.date >= $2::date AND me.date <= $3::date
           )
           OR EXISTS (
             SELECT 1 FROM deposits d WHERE d.user_id = m.user_id AND d.mess_id = $1 AND d.date >= $2::date AND d.date <= $3::date
           )
         )`,
      [messId, monthStart, monthEnd]
    ),
    query(
      "SELECT user_id, quantity, is_guest FROM meal_entries WHERE mess_id = $1 AND date >= $2::date AND date <= $3::date",
      [messId, monthStart, monthEnd]
    ),
    query(
      "SELECT user_id, amount FROM deposits WHERE mess_id = $1 AND date >= $2::date AND date <= $3::date",
      [messId, monthStart, monthEnd]
    ),
    query(
      "SELECT amount FROM bazar_expenses WHERE mess_id = $1 AND date >= $2::date AND date <= $3::date",
      [messId, monthStart, monthEnd]
    ),
    query(
      "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date_str, SUM(amount) as total FROM bazar_expenses WHERE mess_id = $1 AND date >= $2::date AND date <= $3::date GROUP BY TO_CHAR(date, 'YYYY-MM-DD') ORDER BY TO_CHAR(date, 'YYYY-MM-DD')",
      [messId, monthStart, monthEnd]
    ),
    query(
      "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date_str, SUM(quantity) as total FROM meal_entries WHERE mess_id = $1 AND date >= $2::date AND date <= $3::date GROUP BY TO_CHAR(date, 'YYYY-MM-DD') ORDER BY TO_CHAR(date, 'YYYY-MM-DD')",
      [messId, monthStart, monthEnd]
    ),
  ]);

  const totalExpenses = expensesResult.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalMeals = mealsResult.reduce((s: number, m: any) => s + Number(m.quantity), 0);
  const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
  const totalDeposits = depositsResult.reduce((s: number, d: any) => s + Number(d.amount), 0);

  const expenseByDate = new Map<string, number>();
  for (const e of dailyExpenses) expenseByDate.set(e.date_str, Number(e.total));
  const mealsByDate = new Map<string, number>();
  for (const m of dailyMeals) mealsByDate.set(m.date_str, Number(m.total));

  const allDays = eachDayOfInterval({ start: new Date(monthStart), end: new Date(monthEnd) });
  let cumExpenses = 0;
  let cumMeals = 0;
  const dailyMealRateData = allDays.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    cumExpenses += expenseByDate.get(key) || 0;
    cumMeals += mealsByDate.get(key) || 0;
    return { date: key, rate: cumMeals > 0 ? cumExpenses / cumMeals : 0 };
  });

  const userTotals = new Map<string, { meals: number; guestMeals: number; deposit: number }>();
  for (const m of mealsResult) {
    const entry = userTotals.get(m.user_id) || { meals: 0, guestMeals: 0, deposit: 0 };
    if (m.is_guest) entry.guestMeals += Number(m.quantity);
    else entry.meals += Number(m.quantity);
    userTotals.set(m.user_id, entry);
  }
  for (const d of depositsResult) {
    const entry = userTotals.get(d.user_id);
    if (entry) entry.deposit += Number(d.amount);
  }

  const report = members.map((m: any) => {
    const t = userTotals.get(m.user_id) || { meals: 0, guestMeals: 0, deposit: 0 };
    return {
      name: m.name || "Unknown",
      avatarUrl: m.avatar_url,
      role: m.role,
      totalMeals: t.meals,
      totalGuestMeals: t.guestMeals,
      totalDeposit: t.deposit,
      totalExpense: (t.meals + t.guestMeals) * mealRate,
      balance: t.deposit - (t.meals + t.guestMeals) * mealRate,
    };
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-start justify-between pt-5 pb-2 gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard/user/views"
              className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="text-[26px] md:text-[30px] font-extrabold text-foreground leading-tight">Final Report</h1>
              <p className="text-[13.5px] md:text-[15px] text-muted-foreground">Overview of all members</p>
            </div>
          </div>
          <MonthPicker currentMonth={currentMonth} />
        </div>

        {/* Stats Grid — 2 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 py-3.5">
          {/* Total Members */}
          <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 21C2 17.13 5.13 14 9 14C10.2 14 11.3 14.3 12.3 14.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M17.5 14C19.99 14 22 16.01 22 18.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Total Members</p>
            <p className="text-[20px] md:text-[24px] font-extrabold text-foreground">{members.length}</p>
          </div>

          {/* Total Meals */}
          <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#e3faf0] dark:bg-[#1a3d2a] flex items-center justify-center mb-3">
              <img src="/icons/meal-utensils.svg" alt="" className="w-[36px] h-[36px]" />
            </div>
            <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Total Meals</p>
            <p className="text-[20px] md:text-[24px] font-extrabold text-foreground">{totalMeals.toFixed(1)}</p>
          </div>

          {/* Total Deposit */}
          <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#fff8e6] dark:bg-[#4a3f1a] flex items-center justify-center mb-3">
              <img src="/icons/coin.svg" alt="" className="w-[32px] h-[32px]" />
            </div>
            <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Total Deposit</p>
            <p className="text-[20px] md:text-[24px] font-extrabold text-foreground">৳{totalDeposits.toFixed(0)}</p>
          </div>

          {/* Total Expense */}
          <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#ffe9ee] dark:bg-[#4a2030] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 8.5C2 7.12 3.12 6 4.5 6H19.5C20.88 6 22 7.12 22 8.5V15.5C22 16.88 20.88 18 19.5 18H4.5C3.12 18 2 16.88 2 15.5V8.5Z" stroke="#f0396b" strokeWidth="1.8" />
                <path d="M2 10H22" stroke="#f0396b" strokeWidth="1.8" />
                <path d="M6 14H10" stroke="#f0396b" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Total Expense</p>
            <p className="text-[20px] md:text-[24px] font-extrabold text-foreground">৳{totalExpenses.toFixed(0)}</p>
          </div>

          {/* Available Bazar Balance */}
          <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#e0f7e9] dark:bg-[#1a3d2a] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#12b76a" strokeWidth="1.8" />
                <path d="M12 6V12L16 14" stroke="#12b76a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Available Balance</p>
            <p className={`text-[20px] md:text-[24px] font-extrabold ${totalDeposits - totalExpenses < 0 ? "text-[#f0396b]" : "text-[#12b76a]"}`}>
              ৳{(totalDeposits - totalExpenses).toFixed(0)}
            </p>
          </div>

          {/* Meal Rate - Clickable with graph */}
          <MealRateGraph data={dailyMealRateData} monthLabel={monthLabel} mealRate={mealRate} />
        </div>

        {/* Table Card */}
        <div className="bg-card mt-2 rounded-[20px] p-5 pb-1 shadow-[0_2px_10px_rgba(30,30,60,0.05)]">
          <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] text-[10px] md:text-[12px] font-bold tracking-wider pb-3 border-b border-border">
            <span className="text-muted-foreground">NAME</span>
            <span className="text-center text-primary bg-primary/10 dark:bg-primary/20 rounded-lg py-1 border-r border-border">MEALS</span>
            <span className="text-center text-[#7c6cf6] dark:text-[#a89cff] bg-[#ece9fe] dark:bg-[#3d3566] rounded-lg py-1 border-r border-border">GUEST</span>
            <span className="text-center text-[#2f80ed] dark:text-[#6baaff] bg-[#e4f1ff] dark:bg-[#1e3456] rounded-lg py-1 border-r border-border">DEPOSIT</span>
            <span className="text-center text-[#d98a1c] dark:text-[#f0b060] bg-[#fff2df] dark:bg-[#4a3520] rounded-lg py-1 border-r border-border">EXPENSE</span>
            <span className="text-center text-[#12b76a] dark:text-[#4dd99a] bg-[#e0f7e9] dark:bg-[#1a3d2a] rounded-lg py-1">BALANCE</span>
          </div>

          {/* Table Rows */}
          {report.length > 0 ? (
            report.map((r: any, i: number) => {
              const color = badgeColors[i % badgeColors.length];
              const initial = r.name.charAt(0).toUpperCase();
              return (
                <div key={r.name} className="grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] items-center py-3.5 md:py-4 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt={r.name} className="w-[38px] h-[38px] rounded-full object-cover shrink-0 bg-muted" />
                    ) : (
                      <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[15px] shrink-0 ${color.bg} ${color.text}`}>
                        {initial}
                      </div>
                    )}
                    <span className="text-[14px] md:text-[15px] font-semibold text-foreground truncate">{r.name}</span>
                  </div>
                  <span className="text-center text-[13px] md:text-[14px] font-semibold text-primary bg-primary/10/60 dark:bg-primary/20/60 rounded-lg py-2 border-r border-border">{r.totalMeals.toFixed(1)}</span>
                  <span className="text-center text-[13px] md:text-[14px] font-semibold text-[#7c6cf6] dark:text-[#a89cff] bg-[#ece9fe]/60 dark:bg-[#3d3566]/60 rounded-lg py-2 border-r border-border">{r.totalGuestMeals.toFixed(1)}</span>
                  <span className="text-center text-[13px] md:text-[14px] font-semibold text-[#2f80ed] dark:text-[#6baaff] bg-[#e4f1ff]/60 dark:bg-[#1e3456]/60 rounded-lg py-2 border-r border-border">৳{r.totalDeposit.toFixed(0)}</span>
                  <span className="text-center text-[13px] md:text-[14px] font-semibold text-[#d98a1c] dark:text-[#f0b060] bg-[#fff2df]/60 dark:bg-[#4a3520]/60 rounded-lg py-2 border-r border-border">৳{r.totalExpense.toFixed(0)}</span>
                  <span className={`text-center text-[13px] md:text-[14px] font-bold rounded-lg py-2 ${r.balance < 0 ? "text-[#f0396b] dark:text-[#ff6b8a] bg-[#ffe9ee]/60 dark:bg-[#4a2030]/60" : "text-[#12b76a] dark:text-[#4dd99a] bg-[#e0f7e9]/60 dark:bg-[#1a3d2a]/60"}`}>
                    ৳{r.balance.toFixed(0)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm md:text-[15px] text-muted-foreground text-center py-10">No data available for this month</p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
