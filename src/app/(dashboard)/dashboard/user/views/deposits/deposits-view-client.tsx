"use client";

import { useState } from "react";
import { format } from "date-fns";

const badgeColors = [
  { bg: "bg-[#ece9fe]", text: "text-[#7c6cf6]" },
  { bg: "bg-[#e3faf0]", text: "text-[#1bbf7e]" },
  { bg: "bg-[#fff2df]", text: "text-[#f2a03d]" },
  { bg: "bg-[#e4f1ff]", text: "text-[#3fa6ec]" },
];

export function DepositsViewClient({
  deposits,
  expenses,
  currentUserId,
}: {
  deposits: any[];
  expenses: any[];
  currentUserId: string;
}) {
  const [tab, setTab] = useState<"my" | "others">("my");

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

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="bg-white rounded-[16px] p-1.5 flex shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
        <button
          onClick={() => setTab("my")}
          className={`flex-1 py-3 rounded-[12px] text-[13px] font-bold transition-all ${
            tab === "my" ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
          }`}
        >
          My Deposits & Expenses
        </button>
        <button
          onClick={() => setTab("others")}
          className={`flex-1 py-3 rounded-[12px] text-[13px] font-bold transition-all ${
            tab === "others" ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
          }`}
        >
          Others&apos; Deposits & Expenses
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
          <p className="text-[11px] font-bold text-[#8b8fa3] tracking-wider mb-1">DEPOSITS</p>
          <p className="text-[20px] font-extrabold text-[#3fa6ec]">৳{totalActiveDeposits.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
          <p className="text-[11px] font-bold text-[#8b8fa3] tracking-wider mb-1">EXPENSES</p>
          <p className="text-[20px] font-extrabold text-[#f2a03d]">৳{totalActiveExpenses.toFixed(0)}</p>
        </div>
      </div>

      {/* By Date: Deposits Left, Expenses Right */}
      {allDates.length > 0 ? (
        <div className="space-y-3">
          {allDates.map((dateKey) => {
            const dayDeposits = activeDeposits.filter((d: any) => format(new Date(d.date), "yyyy-MM-dd") === dateKey);
            const dayExpenses = activeExpenses.filter((e: any) => format(new Date(e.date), "yyyy-MM-dd") === dateKey);
            const depTotal = dayDeposits.reduce((s: number, d: any) => s + Number(d.amount), 0);
            const expTotal = dayExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

            return (
              <div key={dateKey} className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
                <p className="text-[12px] font-bold text-[#8b8fa3] tracking-wider mb-3">
                  {format(new Date(dateKey), "EEE, d MMM yyyy")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Deposits */}
                  <div className="bg-[#f8fbff] rounded-[14px] p-3 border border-[#e4f1ff]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#3fa6ec] tracking-wider">DEPOSITS</span>
                      <span className="text-[12px] font-extrabold text-[#3fa6ec]">৳{depTotal.toFixed(0)}</span>
                    </div>
                    {dayDeposits.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayDeposits.map((dep: any, i: number) => {
                          const color = badgeColors[i % badgeColors.length];
                          return (
                            <div key={dep.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${color.bg} ${color.text}`}>
                                  {(dep.member_name || "U").charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-semibold text-[#1e2130] truncate">{dep.member_name || "Unknown"}</span>
                              </div>
                              <span className="text-[11px] font-bold text-[#3fa6ec] shrink-0 ml-1">৳{Number(dep.amount).toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8b8fa3] text-center py-2">No deposits</p>
                    )}
                  </div>

                  {/* Expenses */}
                  <div className="bg-[#fffbf5] rounded-[14px] p-3 border border-[#fff2df]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#f2a03d] tracking-wider">EXPENSES</span>
                      <span className="text-[12px] font-extrabold text-[#f2a03d]">৳{expTotal.toFixed(0)}</span>
                    </div>
                    {dayExpenses.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayExpenses.map((exp: any, i: number) => {
                          const color = badgeColors[i % badgeColors.length];
                          return (
                            <div key={exp.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${color.bg} ${color.text}`}>
                                  {(exp.member_name || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[11px] font-semibold text-[#1e2130] truncate block">{exp.member_name || "Unknown"}</span>
                                  {exp.notes && <span className="text-[9px] text-[#8b8fa3] truncate block">{exp.notes}</span>}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#f2a03d] shrink-0 ml-1">৳{Number(exp.amount).toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8b8fa3] text-center py-2">No expenses</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[18px] p-8 shadow-[0_2px_8px_rgba(30,30,60,0.05)] text-center">
          <p className="text-[13px] text-[#8b8fa3]">No data this month</p>
        </div>
      )}
    </div>
  );
}
