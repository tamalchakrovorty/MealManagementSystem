"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from "date-fns";
import { getFoodImage } from "@/lib/food-images";

interface Menu {
  id: string;
  date: string;
  lunch: string | null;
  dinner: string | null;
}

export function MenuViewClient({ menus }: { menus: Menu[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  useEffect(() => { setCurrentMonth(new Date()); }, []);
  const [activeTab, setActiveTab] = useState<"lunch" | "dinner">("lunch");

  if (!currentMonth) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const menuMap = new Map<string, Menu>();
  for (const m of menus) {
    menuMap.set(format(new Date(m.date), "yyyy-MM-dd"), m);
  }

  const menuItems = daysInMonth
    .map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const menu = menuMap.get(key);
      return {
        date: day,
        label: format(day, "dd MMM (EEE)"),
        items: activeTab === "lunch" ? menu?.lunch : menu?.dinner,
      };
    })
    .filter((item) => item.items && item.items.trim() !== "")
    .reverse();

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 px-1">
        <Link href="/dashboard/user/views" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-lg font-bold">Monthly Menu</span>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-[14px] px-4 py-3 flex items-center justify-between" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-[#999] p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-[#999] p-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Lunch/Dinner Toggle */}
      <div className="bg-white rounded-3xl p-1 flex" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <button
          onClick={() => setActiveTab("lunch")}
          className={`flex-1 text-center py-2.5 rounded-[20px] text-sm font-semibold transition-colors ${
            activeTab === "lunch" ? "bg-[#6a4fd8] text-white" : "text-[#555]"
          }`}
        >
          Lunch
        </button>
        <button
          onClick={() => setActiveTab("dinner")}
          className={`flex-1 text-center py-2.5 rounded-[20px] text-sm font-semibold transition-colors ${
            activeTab === "dinner" ? "bg-[#6a4fd8] text-white" : "text-[#555]"
          }`}
        >
          Dinner
        </button>
      </div>

      {/* Day Cards */}
      <div className="space-y-3.5">
        {menuItems.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 flex items-center justify-between"
            style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
          >
            <div className="min-w-0">
              <div className="text-[14.5px] font-bold mb-1.5">{item.label}</div>
              <div className="text-[12.5px] text-[#666] leading-snug max-w-[200px]">
                {item.items || "Not set"}
              </div>
            </div>
            <div className="w-[62px] h-[62px] rounded-full bg-[#ddd] shrink-0 overflow-hidden">
              <img
                src={getFoodImage(item.items || "", i)}
                alt="meal"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
