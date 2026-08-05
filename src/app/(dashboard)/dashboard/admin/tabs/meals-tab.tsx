"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { popup } from "@/lib/popup";

type SlotQty = { lunch: string; dinner: string };

const MEAL_OFF_OPTIONS: Record<string, { label: string; color: string; bg: string; lockedQty: number | null }> = {
  off: { label: "OFF", color: "#e5484d", bg: "#fadada", lockedQty: 0 },
  rice_only: { label: "Rice Only", color: "#d98a1c", bg: "#fff2df", lockedQty: 0.5 },
  curry_only: { label: "Curry Only", color: "#c47a20", bg: "#fef3e2", lockedQty: 0.5 },
  on: { label: "On", color: "#1fae70", bg: "#e3faf0", lockedQty: null },
};

export function MealsTab({ messId, members }: { messId: string; members: any[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  useEffect(() => { setDate(format(new Date(), "yyyy-MM-dd")); }, []);
  const [mealType, setMealType] = useState<"regular" | "guest">("regular");
  const [slot, setSlot] = useState<"lunch" | "dinner">("lunch");
  const [lunchMenu, setLunchMenu] = useState("");
  const [dinnerMenu, setDinnerMenu] = useState("");
  const [mealData, setMealData] = useState<Record<string, SlotQty>>(() => {
    const init: Record<string, SlotQty> = {};
    for (const m of members) {
      init[m.user_id] = { lunch: "0", dinner: "0" };
    }
    return init;
  });
  const [mealOffMap, setMealOffMap] = useState<Record<string, { lunch: string; dinner: string }>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      setFetching(true);
      try {
        const [mealRes, menuRes] = await Promise.all([
          fetch(`/api/admin/meals?mess_id=${messId}&date=${date}&is_guest=${mealType === "guest"}&meal_off_date=${date}`, { signal: controller.signal }),
          fetch(`/api/admin/menu?mess_id=${messId}&date=${date}`, { signal: controller.signal }),
        ]);
        const mealData = await mealRes.json();
        const menuData = await menuRes.json();
        if (!cancelled) {
          const saved = mealData.meals || {};
          const offData = mealData.mealOffData || {};
          const updated: Record<string, SlotQty> = {};
          for (const m of members) {
            const off = offData[m.user_id];
            if (off) {
              const lunchOpt = MEAL_OFF_OPTIONS[off.lunch];
              const dinnerOpt = MEAL_OFF_OPTIONS[off.dinner];
              updated[m.user_id] = {
                lunch: String(lunchOpt?.lockedQty ?? 0),
                dinner: String(dinnerOpt?.lockedQty ?? 0),
              };
            } else {
              const s = saved[m.user_id];
              if (s) {
                updated[m.user_id] = {
                  lunch: s.lunch > 0 ? String(s.lunch) : "0",
                  dinner: s.dinner > 0 ? String(s.dinner) : "0",
                };
              } else {
                updated[m.user_id] = { lunch: "0", dinner: "0" };
              }
            }
          }
          setMealData(updated);
          setMealOffMap(offData);
          const menu = menuData.menu || {};
          setLunchMenu(menu.lunch_menu || "");
          setDinnerMenu(menu.dinner_menu || "");
          setFetching(false);
        }
      } catch {
        if (!cancelled) setFetching(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [date, messId, mealType]);

  const isSlotLocked = (userId: string, checkSlot: "lunch" | "dinner") => {
    const off = mealOffMap[userId];
    if (!off) return false;
    const option = off[checkSlot];
    return option === "off" || option === "rice_only" || option === "curry_only";
  };

  const getSlotBadge = (userId: string, checkSlot: "lunch" | "dinner") => {
    const off = mealOffMap[userId];
    if (!off) return null;
    const option = off[checkSlot];
    return MEAL_OFF_OPTIONS[option] || null;
  };

  const handleChange = (userId: string, val: string) => {
    if (isSlotLocked(userId, slot)) return;
    if (val === "" || val === ".") {
      setMealData((prev) => ({ ...prev, [userId]: { ...prev[userId], [slot]: val } }));
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setMealData((prev) => ({ ...prev, [userId]: { ...prev[userId], [slot]: val } }));
    }
  };

  const handleBlur = (userId: string) => {
    if (isSlotLocked(userId, slot)) return;
    const val = mealData[userId]?.[slot] || "0";
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      setMealData((prev) => ({ ...prev, [userId]: { ...prev[userId], [slot]: "0" } }));
    }
  };

  const increment = (userId: string) => {
    if (isSlotLocked(userId, slot)) return;
    setMealData((prev) => {
      const cur = Number(prev[userId]?.[slot] || 0);
      return { ...prev, [userId]: { ...prev[userId], [slot]: String(cur + 0.5) } };
    });
  };

  const decrement = (userId: string) => {
    if (isSlotLocked(userId, slot)) return;
    setMealData((prev) => {
      const cur = Number(prev[userId]?.[slot] || 0);
      const next = Math.max(0, cur - 0.5);
      return { ...prev, [userId]: { ...prev[userId], [slot]: String(next) } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isGuest = mealType === "guest";
    const entries: any[] = [];
    for (const [userId, data] of Object.entries(mealData)) {
      const lunchVal = Number(data.lunch);
      const dinnerVal = Number(data.dinner);
      if (!isNaN(lunchVal)) {
        entries.push({ mess_id: messId, user_id: userId, date, slot: "lunch", quantity: lunchVal, is_guest: isGuest });
      }
      if (!isNaN(dinnerVal)) {
        entries.push({ mess_id: messId, user_id: userId, date, slot: "dinner", quantity: dinnerVal, is_guest: isGuest });
      }
    }
    if (entries.length === 0) { popup.error("No meals entered"); setLoading(false); return; }
    const [res] = await Promise.all([
      fetch("/api/admin/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      }),
      fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mess_id: messId, date, lunch_menu: lunchMenu, dinner_menu: dinnerMenu }),
      }),
    ]);
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success(`${entries.length} meal entries saved`); router.refresh(); }
    setLoading(false);
  };

  const isGuest = mealType === "guest";
  const activeColor = isGuest ? "#7c6cf6" : slot === "lunch" ? "#1bbf7e" : "#d98a1c";
  const activeBg = isGuest ? "#ece9fe" : slot === "lunch" ? "#e3faf0" : "#fff2df";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card 1: Date & Menu */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-4">Date & Menu</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#666] mb-1.5">Date</label>
            <DatePickerField value={date} onChange={setDate} className="w-full" />
          </div>

          {/* Lunch / Dinner Toggle */}
          <div className="bg-[#f4f4fb] rounded-[14px] p-1.5 flex">
            <button
              type="button"
              onClick={() => setSlot("lunch")}
              className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                slot === "lunch" ? "bg-[#1bbf7e] text-white shadow-sm" : "text-[#8b8fa3]"
              }`}
            >
              Lunch
            </button>
            <button
              type="button"
              onClick={() => setSlot("dinner")}
              className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                slot === "dinner" ? "bg-[#d98a1c] text-white shadow-sm" : "text-[#8b8fa3]"
              }`}
            >
              Dinner
            </button>
          </div>

          {/* Menu Input — shows only active slot */}
          {slot === "lunch" ? (
            <div>
              <label className="block text-xs font-semibold text-[#1bbf7e] mb-1.5">Lunch Menu</label>
              <input type="text" placeholder="e.g. Egg, Rice" value={lunchMenu} onChange={(e) => setLunchMenu(e.target.value)}
                className="w-full border border-[#e3faf0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1bbf7e] transition-colors bg-[#f9fffe]" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#d98a1c] mb-1.5">Dinner Menu</label>
              <input type="text" placeholder="e.g. Chicken, Bread" value={dinnerMenu} onChange={(e) => setDinnerMenu(e.target.value)}
                className="w-full border border-[#fff2df] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d98a1c] transition-colors bg-[#fffcf8]" />
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Meals Input */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-4">Input Meals</h3>
        <div className="space-y-4">
          {/* Regular / Guest Toggle */}
          <div className="bg-[#f4f4fb] rounded-[14px] p-1.5 flex">
            <button
              type="button"
              onClick={() => setMealType("regular")}
              className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                mealType === "regular" ? "bg-[#5b3fd6] text-white shadow-sm" : "text-[#8b8fa3]"
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => setMealType("guest")}
              className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
                mealType === "guest" ? "bg-[#7c6cf6] text-white shadow-sm" : "text-[#8b8fa3]"
              }`}
            >
              Guest
            </button>
          </div>

          {/* Column Header */}
          <div className="grid grid-cols-[1fr_140px] items-center text-[11px] font-bold tracking-wider text-[#8b8fa3] pb-2 border-b border-[#eef0f4]">
            <span>{isGuest ? "BROUGHT BY" : "MEMBER"}</span>
            <span className="text-center rounded-lg py-1" style={{ color: activeColor, background: activeBg }}>
              {isGuest ? "GUEST " : ""}{slot.toUpperCase()}
            </span>
          </div>

          {/* Member Rows */}
          <div className="space-y-1 max-h-[28rem] overflow-y-auto">
            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#6a4fd8] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#8b8fa3] ml-2">Loading meals...</span>
              </div>
            ) : members.map((member: any) => {
              const data = mealData[member.user_id] || { lunch: "0", dinner: "0" };
              const val = data[slot];
              const locked = isSlotLocked(member.user_id, slot);
              const badge = getSlotBadge(member.user_id, slot);
              return (
                <div key={member.user_id} className="grid grid-cols-[1fr_140px] items-center py-2.5 border-b border-[#f0f0f5] last:border-0">
                  <span className="text-sm font-medium text-[#333] truncate pr-2">{member.name || "Unknown"}</span>
                  <div className="flex items-center justify-center gap-1">
                    {locked && badge ? (
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-lg"
                        style={{ color: badge.color, background: badge.bg }}
                      >
                        {badge.label}
                      </span>
                    ) : (
                      <>
                        <button type="button" onClick={() => decrement(member.user_id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold leading-none shrink-0"
                          style={{ background: activeBg, color: activeColor }}>
                          −
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={val}
                          onChange={(e) => handleChange(member.user_id, e.target.value)}
                          onBlur={() => handleBlur(member.user_id)}
                          className="w-12 text-center text-sm font-bold text-[#1e2130] border-b border-[#e3e0f5] outline-none transition-colors bg-transparent"
                          style={{ borderColor: `${activeColor}33` }}
                        />
                        <button type="button" onClick={() => increment(member.user_id)}
                          className="w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-bold leading-none shrink-0"
                          style={{ background: activeColor }}>
                          +
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
            {loading ? "Saving..." : isGuest ? "Save Guest Meals" : "Save Meals"}
          </button>
        </div>
      </div>
    </form>
  );
}
