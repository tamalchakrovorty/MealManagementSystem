"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { popup } from "@/lib/popup";
import { format, addDays, eachDayOfInterval } from "date-fns";

type MealType = "full" | "rice_only" | "curry_only";
type DurationType = "one_day" | "multi_day";

interface GuestEntry {
  name: string;
  lunch: number;
  lunchType: MealType;
  dinner: number;
  dinnerType: MealType;
  sharedWith: string[];
}

interface Member {
  user_id: string;
  name: string;
}

const mealOptions: { value: MealType; label: string; qty: number; color: string; bg: string }[] = [
  { value: "full", label: "Full Meal", qty: 1, color: "#1fae70", bg: "#e3faf0" },
  { value: "rice_only", label: "Rice Only", qty: 0.5, color: "#d98a1c", bg: "#fff2df" },
  { value: "curry_only", label: "Curry Only", qty: 0.5, color: "#c47a20", bg: "#fef3e2" },
];

export function GuestMealForm({ messId, members }: { messId: string; members: Member[] }) {
  const router = useRouter();
  const [duration, setDuration] = useState<DurationType>("one_day");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(addDays(new Date(), 6), "yyyy-MM-dd"));
  const [todayStr] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [maxDateStr] = useState(() => format(addDays(new Date(), 7), "yyyy-MM-dd"));

  const [guests, setGuests] = useState<GuestEntry[]>([
    { name: "", lunch: 0, lunchType: "full", dinner: 0, dinnerType: "full", sharedWith: [] },
  ]);
  const [expandedShare, setExpandedShare] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const today = todayStr;
  const maxDate = maxDateStr;

  const updateGuest = (index: number, field: keyof GuestEntry, value: string | number | string[]) => {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const setMealSlot = (index: number, slot: "lunch" | "dinner", mealType: MealType) => {
    setGuests((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const currentType = slot === "lunch" ? g.lunchType : g.dinnerType;
        const currentQty = slot === "lunch" ? g.lunch : g.dinner;
        const opt = mealOptions.find((o) => o.value === mealType)!;
        const isSame = currentQty === opt.qty && currentType === mealType;
        if (slot === "lunch") return { ...g, lunch: isSame ? 0 : opt.qty, lunchType: isSame ? "full" : mealType };
        return { ...g, dinner: isSame ? 0 : opt.qty, dinnerType: isSame ? "full" : mealType };
      })
    );
  };

  const addGuest = () => {
    setGuests((prev) => [...prev, { name: "", lunch: 0, lunchType: "full", dinner: 0, dinnerType: "full", sharedWith: [] }]);
  };

  const removeGuest = (index: number) => {
    setGuests((prev) => prev.filter((_, i) => i !== index));
    setExpandedShare((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const canSubmit = guests.every((g) => g.name.trim() && (g.lunch > 0 || g.dinner > 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    try {
      const allDates = duration === "one_day"
        ? [date]
        : eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).map((d) => format(d, "yyyy-MM-dd"));

      const payload = {
        messId,
        dates: allDates,
        guests: guests.map((g) => ({
          name: g.name.trim(),
          lunch: g.lunch,
          lunch_type: g.lunchType,
          dinner: g.dinner,
          dinner_type: g.dinnerType,
          shared_with: g.sharedWith,
        })),
      };

      const res = await fetch("/api/user/guest-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        popup.error(data.error);
      } else {
        popup.success("Guest meal request sent! Waiting for approval.");
        router.push("/dashboard/user");
        router.refresh();
      }
    } catch {
      popup.error("Failed to submit request");
    }
    setLoading(false);
  };

  const renderMealSelector = (guestIdx: number, slot: "lunch" | "dinner") => {
    const guest = guests[guestIdx];
    const currentQty = slot === "lunch" ? guest.lunch : guest.dinner;
    const currentType = slot === "lunch" ? guest.lunchType : guest.dinnerType;
    const slotColor = slot === "lunch" ? "#1bbf7e" : "#d98a1c";
    const slotBg = slot === "lunch" ? "#f0faf5" : "#fffbf5";
    const slotBorder = slot === "lunch" ? "#d5f5e5" : "#fde9c8";

    return (
      <div className="flex-1 rounded-xl p-3 space-y-2" style={{ background: slotBg, border: `1.5px solid ${slotBorder}` }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: slotColor }} />
          <p className="text-[12px] font-bold capitalize" style={{ color: slotColor }}>{slot}</p>
        </div>
        <div className="space-y-1">
          {mealOptions.map((opt) => {
            const isActive = currentQty > 0 && currentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMealSlot(guestIdx, slot, opt.value)}
                className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                  isActive
                    ? "text-white border-transparent"
                    : "border-transparent"
                }`}
                style={isActive
                  ? { background: opt.color, borderColor: opt.color }
                  : { background: "#fff", color: "#888", borderColor: slotBorder }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-0 max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <Link href="/dashboard/user" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 px-6 pb-8 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-xl font-bold text-center mt-1 mb-1.5">Request Guest Meal</h1>
        <p className="text-[13.5px] text-[#777] text-center leading-relaxed mb-5">
          Add guests to have a meal with you
        </p>

        {/* Illustration */}
        <svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" className="w-full mb-6">
          <ellipse cx="160" cy="150" rx="90" ry="12" fill="#d6f3e4" />
          <rect x="80" y="140" width="160" height="8" fill="#b8e8d0" rx="4" />
          <circle cx="120" cy="85" r="18" fill="#f0b088" />
          <path d="M103 83C103 72 110 65 120 65C130 65 137 72 137 83" fill="#2a2015" />
          <rect x="102" y="97" width="36" height="48" rx="10" fill="#5a9270" />
          <circle cx="200" cy="85" r="18" fill="#c98a5c" />
          <path d="M183 83C183 72 190 65 200 65C210 65 217 72 217 83" fill="#1a1410" />
          <rect x="182" y="97" width="36" height="48" rx="10" fill="#4a7fc9" />
          <rect x="140" y="105" width="40" height="35" rx="8" fill="#e8e4f8" stroke="#c7bfe8" strokeWidth="2" />
          <path d="M150 120H170M150 128H165" stroke="#b9aeea" strokeWidth="2" strokeLinecap="round" />
          <circle cx="160" cy="55" r="12" fill="#3CB878" />
          <path d="M154 55L158 59L166 51" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Duration Toggle */}
          <div>
            <label className="block text-[12.5px] font-semibold text-[#666] mb-2">Duration</label>
            <div className="flex gap-2">
              {(["one_day", "multi_day"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                    duration === d
                      ? "bg-[#6a4fd8] text-white border-[#6a4fd8]"
                      : "bg-white text-[#888] border-[#e3e0f5]"
                  }`}
                >
                  {d === "one_day" ? "One Day" : "Multiple Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Date(s) */}
          {duration === "one_day" ? (
            <div>
              <label className="block text-[12.5px] font-semibold text-[#666] mb-2">Date</label>
              <DatePickerField value={date} onChange={setDate} min={today} max={maxDate} className="w-full font-semibold" />
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[12.5px] font-semibold text-[#666] mb-2">From</label>
                <DatePickerField value={startDate} onChange={setStartDate} min={today} max={maxDate} className="w-full font-semibold" />
              </div>
              <div className="flex-1">
                <label className="block text-[12.5px] font-semibold text-[#666] mb-2">To</label>
                <DatePickerField value={endDate} onChange={setEndDate} min={startDate} max={maxDate} className="w-full font-semibold" />
              </div>
            </div>
          )}

          {/* Multi-day preview */}
          {duration === "multi_day" && (
            <div className="bg-[#f8f6ff] rounded-xl px-3.5 py-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6a4fd8" strokeWidth="1.8" />
                <path d="M16 2V6M8 2V6M3 10H21" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="text-[12px] font-semibold text-[#6a4fd8]">
                {eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).length} day{eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).length > 1 ? "s" : ""} selected
              </span>
            </div>
          )}

          {/* Guest Entries */}
          <div className="space-y-3">
            <label className="block text-[12.5px] font-semibold text-[#666]">Guests</label>
            {guests.map((guest, idx) => (
              <div key={idx} className="bg-white border-[1.4px] border-[#e3e0f5] rounded-xl p-4 space-y-3">
                {/* Guest name + remove */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => updateGuest(idx, "name", e.target.value)}
                    placeholder={`Guest ${idx + 1} name`}
                    className="flex-1 bg-transparent border-b border-[#e3e0f5] py-2 text-[14px] font-semibold text-[#222] placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#6a4fd8] transition-colors"
                    required
                  />
                  {guests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuest(idx)}
                      className="w-7 h-7 rounded-full bg-[#fadada] flex items-center justify-center shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6L18 18M6 18L18 6" stroke="#e5484d" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Lunch & Dinner selectors */}
                <div className="flex gap-2">
                  {renderMealSelector(idx, "lunch")}
                  {renderMealSelector(idx, "dinner")}
                </div>

                {/* Share cost */}
                {(guest.lunch > 0 || guest.dinner > 0) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedShare((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-colors border border-[#e3e0f5] bg-[#f8f6ff] text-[#6a4fd8]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {guest.sharedWith.length > 0
                        ? `Shared with ${guest.sharedWith.length} member${guest.sharedWith.length > 1 ? "s" : ""}`
                        : "Share cost with a member"}
                    </button>

                    {expandedShare[idx] && (
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {members.length === 0 ? (
                          <p className="text-[12px] text-[#999]">No other members in this mess</p>
                        ) : (
                          members.map((m) => (
                            <div
                              key={m.user_id}
                              onClick={() => {
                                setGuests((prev) =>
                                  prev.map((g, i) => {
                                    if (i !== idx) return g;
                                    const has = g.sharedWith.includes(m.user_id);
                                    return {
                                      ...g,
                                      sharedWith: has
                                        ? g.sharedWith.filter((id) => id !== m.user_id)
                                        : [...g.sharedWith, m.user_id],
                                    };
                                  })
                                );
                              }}
                              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[#f4f4fb] cursor-pointer"
                            >
                              <div
                                className={`w-5 h-5 rounded border-[1.5px] flex items-center justify-center transition-colors ${
                                  guest.sharedWith.includes(m.user_id)
                                    ? "bg-[#6a4fd8] border-[#6a4fd8]"
                                    : "border-[#ccc]"
                                }`}
                              >
                                {guest.sharedWith.includes(m.user_id) && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[13px] font-medium text-[#333]">{m.name || "Unknown"}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Guest Button */}
            <button
              type="button"
              onClick={addGuest}
              className="w-full border-[1.5px] border-dashed border-[#d9d3f7] rounded-xl py-3 text-[13px] font-bold text-[#6a4fd8] flex items-center justify-center gap-1.5 hover:bg-[#f8f6ff] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              Add Guest
            </button>
          </div>

          {/* Info box */}
          <div className="bg-[#ece9fb] rounded-[14px] p-3.5 flex items-start gap-3 w-full">
            <div className="w-5 h-5 rounded-full bg-[#5b3fd6] flex items-center justify-center shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 11V17" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1.3" fill="#fff" />
              </svg>
            </div>
            <p className="text-[13px] text-[#444] leading-relaxed font-medium">
              Guest meals require manager approval. You can request up to 7 days in advance. Use &quot;Share cost&quot; to split the meal expense with another member.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full bg-[#5b3fd6] text-white rounded-[14px] py-4 text-[15.5px] font-bold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {/* Back */}
        <Link href="/dashboard/user" className="text-sm font-bold text-[#6a4fd8] mt-4">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
