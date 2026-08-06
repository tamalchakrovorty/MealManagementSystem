"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

type TabType = "my" | "others";

const COLORS = {
  primary: "#6A4FD8",
  deposit: "#18B875",
  expense: "#F59E0B",
  danger: "#EF4444",
  blue: "#2F80ED",
  depositBg: "#E8F8F0",
  expenseBg: "#FEF3C7",
  primaryBg: "#EDE9FE",
};

const avatarPastels = [
  "bg-[#E8F8F0] text-[#18B875]",
  "bg-[#FEF3C7] text-[#F59E0B]",
  "bg-[#EDE9FE] text-[#6A4FD8]",
  "bg-[#DBEAFE] text-[#2F80ED]",
  "bg-[#FCE7F3] text-[#EC4899]",
  "bg-[#CCFBF1] text-[#14B8A6]",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarPastels[Math.abs(hash) % avatarPastels.length];
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-[13px]" : "w-10 h-10 text-[15px]";
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${getAvatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SegmentedControl({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: TabType; label: string }[];
  active: TabType;
  onChange: (key: TabType) => void;
}) {
  return (
    <div className="bg-white rounded-[16px] p-[5px] flex shadow-[0_2px_12px_rgba(106,79,216,0.08)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex-1 py-3 md:py-2.5 rounded-[12px] text-[13px] md:text-[14px] font-bold transition-all duration-200 ${
            active === t.key
              ? "bg-[#6A4FD8] text-white shadow-[0_4px_12px_rgba(106,79,216,0.3)]"
              : "text-[#8b8fa3] hover:text-[#6A4FD8]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  icon,
  color,
  subtitle,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-[24px] p-4 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,.06)] hover:-translate-y-[3px] transition-all duration-300">
      <div className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${color}18` }}>
        {icon}
      </div>
      <p className="text-[11px] md:text-[13px] font-semibold text-[#8b8fa3] mb-0.5">{label}</p>
      <p className="text-[20px] md:text-[24px] font-extrabold" style={{ color }}>
        ৳{amount.toFixed(0)}
      </p>
      {subtitle && <p className="text-[10px] md:text-[11px] text-[#b0b3c5] mt-0.5">{subtitle}</p>}
    </div>
  );
}

function TransactionRow({
  type,
  amount,
  name,
  avatarUrl,
  createdAt,
  notes,
}: {
  type: "deposit" | "expense";
  amount: number;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  notes?: string;
}) {
  const color = type === "deposit" ? COLORS.deposit : COLORS.expense;
  const bgColor = type === "deposit" ? COLORS.depositBg : COLORS.expenseBg;
  const time = format(new Date(createdAt), "h:mm a");

  return (
    <div className="flex items-center gap-3 py-3 md:py-3.5 px-1 md:px-2 rounded-xl md:hover:bg-[#f8f8fc] md:transition-colors group">
      <Avatar name={name} avatarUrl={avatarUrl} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] md:text-[15px] font-semibold text-[#1e2130] truncate">{name}</p>
          <span className="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: bgColor, color }}>
            {type === "deposit" ? "Deposit" : "Expense"}
          </span>
        </div>
        {notes && <p className="text-[11px] md:text-[12px] text-[#8b8fa3] truncate mt-0.5">{notes}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-[14px] md:text-[15px] font-bold" style={{ color }}>
          {type === "deposit" ? "+" : "-"}৳{amount.toFixed(0)}
        </p>
        <p className="text-[10px] md:text-[11px] text-[#b0b3c5] mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function DateGroup({
  dateKey,
  dayDeposits,
  dayExpenses,
}: {
  dateKey: string;
  dayDeposits: any[];
  dayExpenses: any[];
}) {
  const depCount = dayDeposits.length;
  const expCount = dayExpenses.length;
  const date = new Date(dateKey);
  const now = new Date();
  const isToday = format(now, "yyyy-MM-dd") === dateKey;
  const isYesterday =
    format(new Date(now.getTime() - 86400000), "yyyy-MM-dd") === dateKey;

  let dateLabel: string;
  if (isToday) dateLabel = "Today";
  else if (isYesterday) dateLabel = "Yesterday";
  else dateLabel = format(date, "EEEE");

  return (
    <div className="bg-white rounded-[24px] p-5 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[16px] md:text-[18px] font-bold text-[#1e2130]">{dateLabel}</p>
          <p className="text-[12px] md:text-[13px] text-[#8b8fa3]">{format(date, "d MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          {depCount > 0 && (
            <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.depositBg, color: COLORS.deposit }}>
              {depCount} Deposit{depCount !== 1 ? "s" : ""}
            </span>
          )}
          {expCount > 0 && (
            <span className="text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.expenseBg, color: COLORS.expense }}>
              {expCount} Expense{expCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-[#f0f0f5]">
        {dayDeposits.map((dep: any) => (
          <TransactionRow
            key={dep.id}
            type="deposit"
            amount={Number(dep.amount)}
            name={dep.member_name || "Unknown"}
            avatarUrl={dep.avatar_url}
            createdAt={dep.created_at}
          />
        ))}
        {dayExpenses.map((exp: any) => (
          <TransactionRow
            key={exp.id}
            type="expense"
            amount={Number(exp.amount)}
            name={exp.member_name || "Unknown"}
            avatarUrl={exp.avatar_url}
            createdAt={exp.created_at}
            notes={exp.notes || undefined}
          />
        ))}
      </div>
    </div>
  );
}

function StatsSidebar({
  activeDeposits,
  activeExpenses,
}: {
  activeDeposits: any[];
  activeExpenses: any[];
}) {
  const depositTotals = new Map<string, { name: string; total: number }>();
  for (const d of activeDeposits) {
    const key = d.user_id;
    const existing = depositTotals.get(key);
    if (existing) existing.total += Number(d.amount);
    else depositTotals.set(key, { name: d.member_name || "Unknown", total: Number(d.amount) });
  }

  let topDepositor = { name: "—", total: 0 };
  for (const [, v] of depositTotals) {
    if (v.total > topDepositor.total) topDepositor = v;
  }

  let highestExpense = { name: "—", amount: 0, notes: "" };
  for (const e of activeExpenses) {
    if (Number(e.amount) > highestExpense.amount) {
      highestExpense = { name: e.member_name || "Unknown", amount: Number(e.amount), notes: e.notes || "" };
    }
  }

  const totalDeposits = activeDeposits.reduce((s: number, d: any) => s + Number(d.amount), 0);
  const uniqueDepositors = depositTotals.size;
  const avgDeposit = uniqueDepositors > 0 ? totalDeposits / uniqueDepositors : 0;

  const totalExpenses = activeExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const net = totalDeposits - totalExpenses;

  return (
    <div className="space-y-4 md:sticky md:top-24">
      <h3 className="text-[15px] md:text-[17px] font-bold text-[#1e2130]">Monthly Summary</h3>

      <div className="bg-white rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,.06)] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.depositBg }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke={COLORS.deposit} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] md:text-[12px] font-semibold text-[#8b8fa3]">Top Depositor</p>
            <p className="text-[14px] md:text-[15px] font-bold text-[#1e2130]">{topDepositor.name}</p>
            <p className="text-[13px] md:text-[14px] font-extrabold" style={{ color: COLORS.deposit }}>৳{topDepositor.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-[#f0f0f5]" />

        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.expenseBg }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke={COLORS.expense} strokeWidth="2" strokeLinecap="round" />
              <path d="M3 6H21" stroke={COLORS.expense} strokeWidth="2" />
              <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke={COLORS.expense} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] md:text-[12px] font-semibold text-[#8b8fa3]">Highest Expense</p>
            <p className="text-[14px] md:text-[15px] font-bold text-[#1e2130]">{highestExpense.name}</p>
            <p className="text-[13px] md:text-[14px] font-extrabold" style={{ color: COLORS.expense }}>৳{highestExpense.amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-[#f0f0f5]" />

        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.primaryBg }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] md:text-[12px] font-semibold text-[#8b8fa3]">Average Deposit</p>
            <p className="text-[13px] md:text-[14px] font-semibold text-[#8b8fa3]">{uniqueDepositors} member{uniqueDepositors !== 1 ? "s" : ""}</p>
            <p className="text-[14px] md:text-[15px] font-bold text-[#1e2130]">৳{avgDeposit.toLocaleString()}</p>
          </div>
        </div>

        <div className="border-t border-[#f0f0f5]" />

        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: net >= 0 ? COLORS.depositBg : "#FEE2E2" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke={net >= 0 ? COLORS.deposit : COLORS.danger} strokeWidth="1.8" />
              <path d="M2 10H22" stroke={net >= 0 ? COLORS.deposit : COLORS.danger} strokeWidth="1.8" />
              <path d="M12 14H16" stroke={net >= 0 ? COLORS.deposit : COLORS.danger} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] md:text-[12px] font-semibold text-[#8b8fa3]">Net Balance</p>
            <p className="text-[14px] md:text-[15px] font-bold" style={{ color: net >= 0 ? COLORS.deposit : COLORS.danger }}>
              {net >= 0 ? "+" : "-"}৳{Math.abs(net).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-[24px] p-10 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,.06)] text-center">
      <div className="w-[72px] h-[72px] rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.primaryBg }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M21 12V22H3V12" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 10L12 3L23 10" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21V14H15V21" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-[16px] md:text-[18px] font-bold text-[#1e2130] mb-1">No transactions this month</p>
      <p className="text-[13px] md:text-[14px] text-[#8b8fa3]">Choose another month to view activity</p>
    </div>
  );
}

function MonthPickerInline({ currentMonth }: { currentMonth: string }) {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2.5 bg-white rounded-[14px] px-4 py-3 shadow-[0_2px_6px_rgba(30,30,60,0.06)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6a4fd8] shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-[14px] font-semibold text-[#1e2130]">{currentMonth}</span>
      </div>
    }>
      <MonthPickerInner currentMonth={currentMonth} />
    </Suspense>
  );
}

function MonthPickerInner({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [current, setCurrent] = useState(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const displayLabel = format(current, "MMMM, yyyy");

  const navigate = (dir: "prev" | "next") => {
    const newDate = dir === "prev"
      ? new Date(current.getFullYear(), current.getMonth() - 1, 1)
      : new Date(current.getFullYear(), current.getMonth() + 1, 1);
    setCurrent(newDate);
    const val = format(newDate, "yyyy-MM");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", val);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-[14px] px-3 py-2 shadow-[0_2px_6px_rgba(30,30,60,0.06)]">
      <button onClick={() => navigate("prev")} className="w-9 h-9 rounded-full bg-[#f4f4fb] hover:bg-[#ece9fe] flex items-center justify-center transition-colors" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 6L9 12L15 18" stroke="#6a4fd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6a4fd8] shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-[14px] font-semibold text-[#1e2130] min-w-[100px] text-center">{displayLabel}</span>
      </div>
      <button onClick={() => navigate("next")} className="w-9 h-9 rounded-full bg-[#f4f4fb] hover:bg-[#ece9fe] flex items-center justify-center transition-colors" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="#6a4fd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export function DepositsViewClient({
  deposits,
  expenses,
  currentUserId,
  currentMonth,
}: {
  deposits: any[];
  expenses: any[];
  currentUserId: string;
  currentMonth: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (["my", "others"] as TabType[]).includes(searchParams.get("tab") as TabType)
    ? (searchParams.get("tab") as TabType)
    : "my";
  const [tab, setTab] = useState<TabType>(initialTab);

  const handleTabChange = (t: TabType) => {
    setTab(t);
    router.replace(`?tab=${t}`, { scroll: false });
  };

  const myDeposits = deposits.filter((d: any) => d.user_id === currentUserId);
  const othersDeposits = deposits.filter((d: any) => d.user_id !== currentUserId);
  const activeDeposits = tab === "my" ? myDeposits : othersDeposits;

  const myExpenses = expenses.filter((e: any) => e.user_id === currentUserId);
  const othersExpenses = expenses.filter((e: any) => e.user_id !== currentUserId);
  const activeExpenses = tab === "my" ? myExpenses : othersExpenses;

  const allDates = [...new Set([
    ...activeDeposits.map((d: any) => format(new Date(d.date), "yyyy-MM-dd")),
    ...activeExpenses.map((e: any) => format(new Date(e.date), "yyyy-MM-dd")),
  ])].sort().reverse();

  const totalActiveDeposits = activeDeposits.reduce((s: number, d: any) => s + Number(d.amount), 0);
  const totalActiveExpenses = activeExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netBalance = totalActiveDeposits - totalActiveExpenses;
  const transactionCount = activeDeposits.length + activeExpenses.length;

  return (
    <div className="px-0 md:px-3 py-2 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-0 md:px-0 pt-2 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/user/views"
            className="w-[46px] h-[46px] min-w-[46px] bg-white rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1e2130" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[32px] font-extrabold text-[#1e2130] leading-tight">Deposits & Expenses</h1>
            <p className="text-[13px] md:text-[15px] text-[#8b8fa3]">Track all deposits and bazar expenses</p>
          </div>
        </div>
        <div className="hidden md:block">
          <MonthPickerInline currentMonth={currentMonth} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
        <SummaryCard
          label="Total Deposits"
          amount={totalActiveDeposits}
          color={COLORS.deposit}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke={COLORS.deposit} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Expenses"
          amount={totalActiveExpenses}
          color={COLORS.expense}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke={COLORS.expense} strokeWidth="2" strokeLinecap="round" />
              <path d="M3 6H21" stroke={COLORS.expense} strokeWidth="2" />
              <path d="M16 10C16 12.2 14.2 14 12 14C9.8 14 8 12.2 8 10" stroke={COLORS.expense} strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />
        <SummaryCard
          label="Net Balance"
          amount={Math.abs(netBalance)}
          color={netBalance >= 0 ? COLORS.deposit : COLORS.danger}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke={COLORS.primary} strokeWidth="1.8" />
              <path d="M2 10H22" stroke={COLORS.primary} strokeWidth="1.8" />
              <path d="M12 14H16" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <SummaryCard
          label="Transactions"
          amount={transactionCount}
          color={COLORS.blue}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V17" stroke={COLORS.blue} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 11L21 4M21 4L14 4M21 4V11" stroke={COLORS.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div className="w-full md:w-auto md:min-w-[260px]">
          <SegmentedControl
            tabs={[
              { key: "my", label: "My Activity" },
              { key: "others", label: "Everyone" },
            ]}
            active={tab}
            onChange={handleTabChange}
          />
        </div>
        <div className="hidden md:block md:ml-auto">
          <MonthPickerInline currentMonth={currentMonth} />
        </div>
      </div>

      {/* Mobile Month Picker */}
      <div className="md:hidden mb-4">
        <MonthPickerInline currentMonth={currentMonth} />
      </div>

      {/* Main Content */}
      {allDates.length > 0 ? (
        <div className="md:grid md:grid-cols-[1fr_280px] md:gap-6">
          {/* Timeline */}
          <div className="space-y-4 md:space-y-5">
            {allDates.map((dateKey) => {
              const dayDeposits = activeDeposits.filter((d: any) => format(new Date(d.date), "yyyy-MM-dd") === dateKey);
              const dayExpenses = activeExpenses.filter((e: any) => format(new Date(e.date), "yyyy-MM-dd") === dateKey);
              return (
                <DateGroup
                  key={dateKey}
                  dateKey={dateKey}
                  dayDeposits={dayDeposits}
                  dayExpenses={dayExpenses}
                />
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="hidden md:block mt-0">
            <StatsSidebar activeDeposits={activeDeposits} activeExpenses={activeExpenses} />
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
