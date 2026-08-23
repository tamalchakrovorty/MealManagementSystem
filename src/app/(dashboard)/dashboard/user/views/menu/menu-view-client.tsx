"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { getFoodImage } from "@/lib/food-images";

interface Menu {
  id: string;
  date: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

export function MenuViewClient({ menus }: { menus: Menu[] }) {
  const [activeTab, setActiveTab] = useState<"breakfast" | "lunch" | "dinner">("breakfast");
  const [dateSearch, setDateSearch] = useState("");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
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
        items: activeTab === "breakfast" ? menu?.breakfast : activeTab === "lunch" ? menu?.lunch : menu?.dinner,
      };
    })
    .filter((item) => item.items && item.items.trim() !== "")
    .reverse();

  const filteredItems = dateSearch
    ? menuItems.filter((item) => {
        const label = item.label.toLowerCase();
        return label.includes(dateSearch.toLowerCase());
      })
    : menuItems;

  return (
    <div className="space-y-4">
      {/* Breakfast/Lunch/Dinner Toggle */}
      <div className="bg-card rounded-[16px] p-1.5 flex shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
        <button
          onClick={() => setActiveTab("breakfast")}
          className={`flex-1 py-3 md:py-3.5 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            activeTab === "breakfast" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Breakfast
        </button>
        <button
          onClick={() => setActiveTab("lunch")}
          className={`flex-1 py-3 md:py-3.5 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            activeTab === "lunch" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Lunch
        </button>
        <button
          onClick={() => setActiveTab("dinner")}
          className={`flex-1 py-3 md:py-3.5 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            activeTab === "dinner" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Dinner
        </button>
      </div>

      {/* Date Search */}
      <div className="bg-card rounded-[14px] px-4 py-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground shrink-0">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={dateSearch}
          onChange={(e) => setDateSearch(e.target.value)}
          placeholder="Search date (e.g. 5 Aug, Tue)"
          className="flex-1 text-[14px] md:text-[15px] text-foreground placeholder:text-[#b0b3c5] outline-none bg-transparent"
        />
        {dateSearch.length > 0 && (
          <button
            type="button"
            onClick={() => setDateSearch("")}
            className="w-6 h-6 rounded-full bg-[#f0f0f5] hover:bg-[#e4e4ed] flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Menu Cards */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {filteredItems.map((item, i) => (
            <div
              key={i}
              className="bg-card rounded-[18px] p-4 md:p-5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:shadow-[0_8px_24px_rgba(30,30,60,0.08)] md:transition-shadow md:duration-200"
            >
              <div className="min-w-0 flex-1 mr-3">
                <div className="text-[13px] md:text-[14px] font-bold text-muted-foreground tracking-wider mb-1.5">
                  {item.label}
                </div>
                <div className="text-[14px] md:text-[15px] font-semibold text-foreground leading-snug">
                  {item.items || "Not set"}
                </div>
              </div>
              <div className="w-[62px] h-[62px] md:w-[72px] md:h-[72px] rounded-full bg-muted shrink-0 overflow-hidden">
                <img
                  src={getFoodImage(item.items || "", i)}
                  alt="meal"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-[18px] p-8 md:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-center">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[14px] md:text-[16px] text-muted-foreground">
            {dateSearch
              ? <>No menus found for &ldquo;{dateSearch}&rdquo;</>
              : <>No {activeTab} menus for this month</>
            }
          </p>
        </div>
      )}
    </div>
  );
}
