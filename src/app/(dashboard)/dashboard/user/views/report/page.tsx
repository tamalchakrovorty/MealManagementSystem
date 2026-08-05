import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { format, eachDayOfInterval } from "date-fns";
import { MonthPicker } from "./month-picker";
import { MealRateGraph } from "./meal-rate-graph";

const badgeColors = [
  { bg: "bg-[#ece9fe]", text: "text-[#7c6cf6]" },
  { bg: "bg-[#e3faf0]", text: "text-[#1bbf7e]" },
  { bg: "bg-[#fff2df]", text: "text-[#f2a03d]" },
  { bg: "bg-[#e4f1ff]", text: "text-[#3fa6ec]" },
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
      "SELECT user_id, quantity, is_guest FROM meal_entries WHERE mess_id = $1 AND is_guest = false AND date >= $2::date AND date <= $3::date",
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
      "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date_str, SUM(quantity) as total FROM meal_entries WHERE mess_id = $1 AND is_guest = false AND date >= $2::date AND date <= $3::date GROUP BY TO_CHAR(date, 'YYYY-MM-DD') ORDER BY TO_CHAR(date, 'YYYY-MM-DD')",
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
      totalExpense: t.meals * mealRate,
      balance: t.deposit - t.meals * mealRate,
    };
  });

  return (
    <div className="min-h-screen" style={{ background: "#eef0fb" }}>
      <div className="max-w-lg mx-auto">
        {/* Header Section */}
        <div className="flex items-start justify-between px-5 pt-5 pb-2 gap-3">
          <div className="flex items-start gap-3">
            <Link
              href="/dashboard/user/views"
              className="w-[46px] h-[46px] min-w-[46px] bg-white rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1e2130" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="text-[26px] font-extrabold text-[#1e2130] leading-tight">Final Report</h1>
              <p className="text-[13.5px] text-[#8b8fa3]">Overview of all members</p>
            </div>
          </div>
          <MonthPicker currentMonth={currentMonth} />
        </div>

        {/* Stats Grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3 px-5 py-3.5">
          {/* Total Members */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#ece9fe] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="3.5" stroke="#7c6cf6" strokeWidth="1.8" />
                <path d="M2 21C2 17.13 5.13 14 9 14C10.2 14 11.3 14.3 12.3 14.8" stroke="#7c6cf6" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="17" cy="8" r="2.5" stroke="#7c6cf6" strokeWidth="1.8" />
                <path d="M17.5 14C19.99 14 22 16.01 22 18.5" stroke="#7c6cf6" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Total Members</p>
            <p className="text-[20px] font-extrabold text-[#1e2130]">{members.length}</p>
          </div>

          {/* Total Meals */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#e3faf0] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 12C3 8.5 5 6 8 5C9 4.7 10 4.6 11 4.7V3.5C11 2.67 11.67 2 12.5 2C13.33 2 14 2.67 14 3.5V4.7C16 4.5 18 5.5 19 8C20 10.5 20 14 18 17H6C4 14 3 11 3 12Z" stroke="#1bbf7e" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8 21H16" stroke="#1bbf7e" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10 21V18" stroke="#1bbf7e" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M14 21V18" stroke="#1bbf7e" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Total Meals</p>
            <p className="text-[20px] font-extrabold text-[#1e2130]">{totalMeals.toFixed(1)}</p>
          </div>

          {/* Total Deposit */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#fff8e6] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path d="M537.6 352m-102.4 0a102.4 102.4 0 1 0 204.8 0 102.4 102.4 0 1 0-204.8 0Z" fill="#FFE085" />
                  <path d="M697.6 793.6h-12.8c-12.8 0-25.6-32-38.4-57.6-12.8 6.4-44.8 12.8-83.2 12.8h-25.6c-38.4-6.4-64-6.4-76.8-6.4 0 12.8-6.4 32-25.6 44.8-6.4 6.4-19.2 6.4-32 6.4s-32-6.4-38.4-6.4c-6.4 0-6.4-6.4-6.4-12.8v-64c0-25.6-12.8-32-12.8-32-89.6-38.4-128-96-134.4-140.8-6.4-25.6-6.4-38.4 0-44.8 6.4-6.4 12.8-6.4 19.2-6.4h6.4c12.8 0 38.4-6.4 44.8-25.6 6.4-19.2 19.2-25.6 25.6-32h6.4v-12.8c0-25.6-6.4-44.8-12.8-51.2v-12.8c0-6.4 12.8-6.4 19.2-6.4 44.8 6.4 76.8 32 89.6 38.4 44.8-25.6 89.6-38.4 140.8-38.4 32 0 70.4 0 121.6 19.2 147.2 51.2 134.4 179.2 134.4 185.6 0 44.8-25.6 83.2-44.8 108.8-12.8 19.2-19.2 57.6-25.6 83.2 0 6.4 0 19.2-6.4 25.6 6.4 19.2-6.4 25.6-32 25.6zM345.6 499.2c-6.4 0-12.8 6.4-12.8 12.8s6.4 19.2 19.2 19.2 12.8-6.4 12.8-19.2-6.4-12.8-19.2-12.8z" fill="#9ee09a" />
                </g>
              </svg>
            </div>
            <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Total Deposit</p>
            <p className="text-[20px] font-extrabold text-[#1e2130]">৳{totalDeposits.toFixed(0)}</p>
          </div>

          {/* Total Expense */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#ffe9ee] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M2 8.5C2 7.12 3.12 6 4.5 6H19.5C20.88 6 22 7.12 22 8.5V15.5C22 16.88 20.88 18 19.5 18H4.5C3.12 18 2 16.88 2 15.5V8.5Z" stroke="#f0396b" strokeWidth="1.8" />
                <path d="M2 10H22" stroke="#f0396b" strokeWidth="1.8" />
                <path d="M6 14H10" stroke="#f0396b" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Total Expense</p>
            <p className="text-[20px] font-extrabold text-[#1e2130]">৳{totalExpenses.toFixed(0)}</p>
          </div>

          {/* Available Bazar Balance */}
          <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#e0f7e9] flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#12b76a" strokeWidth="1.8" />
                <path d="M12 6V12L16 14" stroke="#12b76a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Available Balance</p>
            <p className={`text-[20px] font-extrabold ${totalDeposits - totalExpenses < 0 ? "text-[#f0396b]" : "text-[#12b76a]"}`}>
              ৳{(totalDeposits - totalExpenses).toFixed(0)}
            </p>
          </div>

          {/* Meal Rate - Clickable with graph */}
          <MealRateGraph data={dailyMealRateData} monthLabel={monthLabel} mealRate={mealRate} />
        </div>

        {/* Table Card */}
        <div className="bg-white mx-5 mt-2 rounded-[20px] p-5 pb-1 shadow-[0_2px_10px_rgba(30,30,60,0.05)]">
          {/* Table Header */}
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] text-[10px] font-bold tracking-wider pb-3 border-b border-[#eef0f4]">
            <span className="text-[#8b8fa3]">NAME</span>
            <span className="text-center text-[#7c6cf6] bg-[#ece9fe] rounded-lg py-1 border-r border-[#eef0f4]">MEALS</span>
            <span className="text-center text-[#2f80ed] bg-[#e4f1ff] rounded-lg py-1 border-r border-[#eef0f4]">DEPOSIT</span>
            <span className="text-center text-[#d98a1c] bg-[#fff2df] rounded-lg py-1 border-r border-[#eef0f4]">EXPENSE</span>
            <span className="text-center text-[#12b76a] bg-[#e0f7e9] rounded-lg py-1">BALANCE</span>
          </div>

          {/* Table Rows */}
          {report.length > 0 ? (
            report.map((r: any, i: number) => {
              const color = badgeColors[i % badgeColors.length];
              const initial = r.name.charAt(0).toUpperCase();
              return (
                <div key={r.name} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center py-3.5 border-b border-[#eef0f4] last:border-0">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt={r.name} className="w-[38px] h-[38px] rounded-full object-cover shrink-0 bg-[#ddd]" />
                    ) : (
                      <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[15px] shrink-0 ${color.bg} ${color.text}`}>
                        {initial}
                      </div>
                    )}
                    <span className="text-[14px] font-semibold text-[#1e2130] truncate">{r.name}</span>
                  </div>
                  <span className="text-center text-[13px] font-semibold text-[#7c6cf6] bg-[#ece9fe]/60 rounded-lg py-2 border-r border-[#eef0f4]">{r.totalMeals.toFixed(1)}</span>
                  <span className="text-center text-[13px] font-semibold text-[#2f80ed] bg-[#e4f1ff]/60 rounded-lg py-2 border-r border-[#eef0f4]">৳{r.totalDeposit.toFixed(0)}</span>
                  <span className="text-center text-[13px] font-semibold text-[#d98a1c] bg-[#fff2df]/60 rounded-lg py-2 border-r border-[#eef0f4]">৳{r.totalExpense.toFixed(0)}</span>
                  <span className={`text-center text-[13px] font-bold rounded-lg py-2 ${r.balance < 0 ? "text-[#f0396b] bg-[#ffe9ee]/60" : "text-[#12b76a] bg-[#e0f7e9]/60"}`}>
                    ৳{r.balance.toFixed(0)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[#8b8fa3] text-center py-10">No data available for this month</p>
          )}
        </div>
      </div>
    </div>
  );
}
