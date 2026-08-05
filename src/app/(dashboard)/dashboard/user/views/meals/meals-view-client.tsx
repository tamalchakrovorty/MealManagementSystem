"use client";

import { useState } from "react";
import { format } from "date-fns";

const badgeColors = [
  { bg: "bg-[#ece9fe]", text: "text-[#7c6cf6]" },
  { bg: "bg-[#e3faf0]", text: "text-[#1bbf7e]" },
  { bg: "bg-[#fff2df]", text: "text-[#f2a03d]" },
  { bg: "bg-[#e4f1ff]", text: "text-[#3fa6ec]" },
];

export function MealsViewClient({ entries, currentUserId }: { entries: any[]; currentUserId: string }) {
  const [tab, setTab] = useState<"my" | "members">("my");

  const myEntries = entries.filter((e: any) => e.user_id === currentUserId);
  const memberEntries = entries.filter((e: any) => e.user_id !== currentUserId);
  const activeEntries = tab === "my" ? myEntries : memberEntries;

  const dates = [...new Set(activeEntries.map((e: any) => format(new Date(e.date), "yyyy-MM-dd")))].sort().reverse();

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
          My Meals
        </button>
        <button
          onClick={() => setTab("members")}
          className={`flex-1 py-3 rounded-[12px] text-[13px] font-bold transition-all ${
            tab === "members" ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
          }`}
        >
          Members&apos; Meals
        </button>
      </div>

      {dates.length > 0 ? (
        <div className="space-y-3">
          {dates.map((dateKey) => {
            const dayEntries = activeEntries.filter((e: any) => format(new Date(e.date), "yyyy-MM-dd") === dateKey);

            if (tab === "my") {
              // My Meals: aggregate summary per date
              let lunch = 0, dinner = 0, guest = 0;
              for (const e of dayEntries) {
                const qty = Number(e.quantity);
                const isGuest = e.is_guest === true || e.is_guest === "t" || e.is_guest === "true";
                if (isGuest) guest += qty;
                else if (e.slot === "lunch") lunch += qty;
                else dinner += qty;
              }
              return (
                <div key={dateKey} className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
                  <p className="text-[12px] font-bold text-[#8b8fa3] tracking-wider mb-3">
                    {format(new Date(dateKey), "EEE, d MMM yyyy")}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#8b8fa3] mb-1">LUNCH</p>
                      <p className="text-[15px] font-extrabold text-[#1bbf7e]">{lunch.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#8b8fa3] mb-1">DINNER</p>
                      <p className="text-[15px] font-extrabold text-[#d98a1c]">{dinner.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#8b8fa3] mb-1">GUEST</p>
                      <p className="text-[15px] font-extrabold text-[#7c6cf6]">{guest.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#8b8fa3] mb-1">TOTAL</p>
                      <p className="text-[15px] font-extrabold text-[#1e2130]">{(lunch + dinner + guest).toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Members' Meals: table per date
              const dayUserMap = new Map<string, { lunch: number; dinner: number; guest: number }>();
              for (const entry of dayEntries) {
                const name = entry.member_name || "Unknown";
                if (!dayUserMap.has(name)) dayUserMap.set(name, { lunch: 0, dinner: 0, guest: 0 });
                const slot = dayUserMap.get(name)!;
                const qty = Number(entry.quantity);
                const isGuest = entry.is_guest === true || entry.is_guest === "t" || entry.is_guest === "true";
                if (isGuest) slot.guest += qty;
                else if (entry.slot === "lunch") slot.lunch += qty;
                else slot.dinner += qty;
              }
              const dayData = Array.from(dayUserMap.entries()).map(([name, s]) => ({
                name, ...s, total: s.lunch + s.dinner + s.guest,
              }));
              const dayLunch = dayData.reduce((s, r) => s + r.lunch, 0);
              const dayDinner = dayData.reduce((s, r) => s + r.dinner, 0);
              const dayGuest = dayData.reduce((s, r) => s + r.guest, 0);

              return (
                <div key={dateKey} className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
                  <p className="text-[12px] font-bold text-[#8b8fa3] tracking-wider mb-3">
                    {format(new Date(dateKey), "EEE, d MMM yyyy")}
                  </p>
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] text-[10px] font-bold tracking-wider pb-2.5 border-b border-[#eef0f4]">
                    <span className="text-[#8b8fa3]">NAME</span>
                    <span className="text-center text-[#1bbf7e] bg-[#e3faf0] rounded-lg py-1 border-r border-[#eef0f4]">LUNCH</span>
                    <span className="text-center text-[#d98a1c] bg-[#fff2df] rounded-lg py-1 border-r border-[#eef0f4]">DINNER</span>
                    <span className="text-center text-[#7c6cf6] bg-[#ece9fe] rounded-lg py-1 border-r border-[#eef0f4]">GUEST</span>
                    <span className="text-center text-[#1e2130] bg-[#f4f4fb] rounded-lg py-1">TOTAL</span>
                  </div>
                  {dayData.map((row, i) => {
                    const color = badgeColors[i % badgeColors.length];
                    return (
                      <div key={row.name} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] items-center py-2.5 border-b border-[#eef0f4] last:border-0">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${color.bg} ${color.text}`}>
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[12px] font-semibold text-[#1e2130] truncate">{row.name}</span>
                        </div>
                        <span className="text-center text-[12px] font-bold text-[#1bbf7e] bg-[#e3faf0]/60 rounded-md py-1.5 border-r border-[#eef0f4]">{row.lunch.toFixed(1)}</span>
                        <span className="text-center text-[12px] font-bold text-[#d98a1c] bg-[#fff2df]/60 rounded-md py-1.5 border-r border-[#eef0f4]">{row.dinner.toFixed(1)}</span>
                        <span className="text-center text-[12px] font-bold text-[#7c6cf6] bg-[#ece9fe]/60 rounded-md py-1.5 border-r border-[#eef0f4]">{row.guest.toFixed(1)}</span>
                        <span className="text-center text-[12px] font-extrabold text-[#1e2130] bg-[#f4f4fb]/60 rounded-md py-1.5">{row.total.toFixed(1)}</span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] items-center pt-2.5 mt-1 border-t border-[#ddd]">
                    <span className="text-[11px] font-extrabold text-[#1e2130] pl-1">TOTAL</span>
                    <span className="text-center text-[12px] font-extrabold text-[#1bbf7e]">{dayLunch.toFixed(1)}</span>
                    <span className="text-center text-[12px] font-extrabold text-[#d98a1c]">{dayDinner.toFixed(1)}</span>
                    <span className="text-center text-[12px] font-extrabold text-[#7c6cf6]">{dayGuest.toFixed(1)}</span>
                    <span className="text-center text-[12px] font-extrabold text-[#1e2130]">{(dayLunch + dayDinner + dayGuest).toFixed(1)}</span>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[18px] p-8 shadow-[0_2px_8px_rgba(30,30,60,0.05)] text-center">
          <p className="text-[14px] text-[#8b8fa3]">
            {tab === "my" ? "No meals recorded yet" : "No member meals recorded yet"}
          </p>
        </div>
      )}
    </div>
  );
}
