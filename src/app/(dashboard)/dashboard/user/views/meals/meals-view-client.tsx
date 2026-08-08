"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

const badgeColors = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-[#e3faf0]", text: "text-[#1bbf7e]" },
  { bg: "bg-[#fff2df]", text: "text-[#f2a03d]" },
  { bg: "bg-[#e4f1ff]", text: "text-[#3fa6ec]" },
];

type TabType = "my" | "members";

export function MealsViewClient({ entries, currentUserId }: { entries: any[]; currentUserId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (["my", "members"] as TabType[]).includes(searchParams.get("tab") as TabType)
    ? (searchParams.get("tab") as TabType)
    : "my";
  const [tab, setTab] = useState<TabType>(initialTab);
  const [dateSearch, setDateSearch] = useState("");

  const handleTabChange = (t: TabType) => {
    setTab(t);
    router.replace(`?tab=${t}`, { scroll: false });
  };

  const myEntries = entries.filter((e: any) => e.user_id === currentUserId);
  const memberEntries = entries.filter((e: any) => e.user_id !== currentUserId);
  const activeEntries = tab === "my" ? myEntries : memberEntries;

  const dates = [...new Set(activeEntries.map((e: any) => format(new Date(e.date), "yyyy-MM-dd")))].sort().reverse();

  const filteredDates = dateSearch
    ? dates.filter((d) => {
        const label = format(new Date(d), "EEE, d MMM yyyy").toLowerCase();
        return label.includes(dateSearch.toLowerCase());
      })
    : dates;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="bg-card rounded-[16px] p-1.5 flex shadow-[0_2px_8px_rgba(30,30,60,0.05)]">
        <button
          onClick={() => handleTabChange("my")}
          className={`flex-1 py-3 md:py-3.5 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            tab === "my" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          My Meals
        </button>
        <button
          onClick={() => handleTabChange("members")}
          className={`flex-1 py-3 md:py-3.5 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            tab === "members" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Members&apos; Meals
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
          className="flex-1 text-[14px] md:text-[15px] text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
        />
        {dateSearch.length > 0 && (
          <button
            type="button"
            onClick={() => setDateSearch("")}
            className="w-6 h-6 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {filteredDates.length > 0 ? (
        tab === "my" ? (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {filteredDates.map((dateKey) => {
              const dayEntries = entries.filter((e: any) => e.user_id === currentUserId && format(new Date(e.date), "yyyy-MM-dd") === dateKey);
              let lunch = 0, dinner = 0, guest = 0;
              for (const e of dayEntries) {
                const qty = Number(e.quantity);
                const isGuest = e.is_guest === true || e.is_guest === "t" || e.is_guest === "true";
                if (isGuest) guest += qty;
                else if (e.slot === "lunch") lunch += qty;
                else dinner += qty;
              }
              return (
                <div key={dateKey} className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)] md:hover:shadow-[0_8px_24px_rgba(30,30,60,0.08)] md:transition-shadow md:duration-200">
                  <p className="text-[12px] md:text-[14px] font-bold text-muted-foreground tracking-wider mb-3">
                    {format(new Date(dateKey), "EEE, d MMM yyyy")}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] md:text-[12px] font-bold text-muted-foreground mb-1">LUNCH</p>
                      <p className="text-[15px] md:text-[18px] font-extrabold text-[#1bbf7e]">{lunch.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-[12px] font-bold text-muted-foreground mb-1">DINNER</p>
                      <p className="text-[15px] md:text-[18px] font-extrabold text-[#d98a1c]">{dinner.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-[12px] font-bold text-muted-foreground mb-1">GUEST</p>
                      <p className="text-[15px] md:text-[18px] font-extrabold text-primary">{guest.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] md:text-[12px] font-bold text-muted-foreground mb-1">TOTAL</p>
                      <p className="text-[15px] md:text-[18px] font-extrabold text-foreground">{(lunch + dinner + guest).toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDates.map((dateKey) => {
              const dayEntries = entries.filter((e: any) => e.user_id !== currentUserId && format(new Date(e.date), "yyyy-MM-dd") === dateKey);
              const dayUserMap = new Map<string, { lunch: number; dinner: number; guest: number; avatar_url: string | null }>();
              for (const entry of dayEntries) {
                const name = entry.member_name || "Unknown";
                if (!dayUserMap.has(name)) dayUserMap.set(name, { lunch: 0, dinner: 0, guest: 0, avatar_url: entry.avatar_url || null });
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
                <div key={dateKey} className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)] md:hover:shadow-[0_8px_24px_rgba(30,30,60,0.08)] md:transition-shadow md:duration-200">
                  <p className="text-[12px] md:text-[14px] font-bold text-muted-foreground tracking-wider mb-3">
                    {format(new Date(dateKey), "EEE, d MMM yyyy")}
                  </p>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div className="min-w-[420px]">
                      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] text-[10px] md:text-[12px] font-bold tracking-wider pb-2.5 border-b border-border">
                        <span className="text-muted-foreground">NAME</span>
                        <span className="text-center text-[#1bbf7e] bg-[#e3faf0] rounded-lg py-1 border-r border-border">LUNCH</span>
                        <span className="text-center text-[#d98a1c] bg-[#fff2df] rounded-lg py-1 border-r border-border">DINNER</span>
                        <span className="text-center text-primary bg-primary/10 rounded-lg py-1 border-r border-border">GUEST</span>
                        <span className="text-center text-foreground bg-muted rounded-lg py-1">TOTAL</span>
                      </div>
                      {dayData.map((row, i) => {
                        const color = badgeColors[i % badgeColors.length];
                        return (
                          <div key={row.name} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center py-2.5 border-b border-border last:border-0 md:hover:bg-muted md:transition-colors">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {row.avatar_url ? (
                                <Image src={row.avatar_url} alt={row.name} width={32} height={32} className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full object-cover shrink-0 bg-muted" />
                              ) : (
                                <div className={`w-[28px] h-[28px] md:w-[32px] md:h-[32px] rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${color.bg} ${color.text}`}>
                                  {row.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[12px] md:text-[14px] font-semibold text-foreground truncate">{row.name}</span>
                            </div>
                            <span className="text-center text-[12px] md:text-[14px] font-bold text-[#1bbf7e] bg-[#e3faf0]/60 rounded-md py-1.5 border-r border-border">{row.lunch.toFixed(1)}</span>
                            <span className="text-center text-[12px] md:text-[14px] font-bold text-[#d98a1c] bg-[#fff2df]/60 rounded-md py-1.5 border-r border-border">{row.dinner.toFixed(1)}</span>
                            <span className="text-center text-[12px] md:text-[14px] font-bold text-primary bg-primary/10/60 rounded-md py-1.5 border-r border-border">{row.guest.toFixed(1)}</span>
                            <span className="text-center text-[12px] md:text-[14px] font-extrabold text-foreground bg-muted/60 rounded-md py-1.5">{row.total.toFixed(1)}</span>
                          </div>
                        );
                      })}
                      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] items-center pt-2.5 mt-1 border-t border-border">
                        <span className="text-[11px] md:text-[13px] font-extrabold text-foreground pl-1">TOTAL</span>
                        <span className="text-center text-[12px] md:text-[14px] font-extrabold text-[#1bbf7e]">{dayLunch.toFixed(1)}</span>
                        <span className="text-center text-[12px] md:text-[14px] font-extrabold text-[#d98a1c]">{dayDinner.toFixed(1)}</span>
                        <span className="text-center text-[12px] md:text-[14px] font-extrabold text-primary">{dayGuest.toFixed(1)}</span>
                        <span className="text-center text-[12px] md:text-[14px] font-extrabold text-foreground">{(dayLunch + dayDinner + dayGuest).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-card rounded-[18px] p-8 md:p-10 shadow-[0_2px_8px_rgba(30,30,60,0.05)] text-center">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {dateSearch ? (
                <path d="M11 3C7.13 3 4 6.13 4 10C4 11.38 4.5 12.64 5.28 13.66L3.41 15.53L4.47 16.59L6.34 14.72C7.36 15.5 8.62 16 10 16C13.87 16 17 12.87 17 9C17 5.13 13.87 2 11 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 6H20M4 12H20M4 18H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </div>
          <p className="text-[14px] md:text-[16px] text-muted-foreground">
            {dateSearch
              ? <>No meals found for &ldquo;{dateSearch}&rdquo;</>
              : tab === "my" ? "No meals recorded yet" : "No member meals recorded yet"
            }
          </p>
        </div>
      )}
    </div>
  );
}
