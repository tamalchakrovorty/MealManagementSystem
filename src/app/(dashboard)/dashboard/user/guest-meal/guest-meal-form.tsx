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
  breakfast: number;
  breakfastType: MealType;
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

const mealOptions: { value: MealType; label: string; qty: number; color: string; bg: string; border: string }[] = [
  { value: "full", label: "Full Meal", qty: 1, color: "var(--success)", bg: "var(--success-bg)", border: "var(--success-border)" },
  { value: "rice_only", label: "Rice Only", qty: 0.5, color: "var(--warning)", bg: "var(--warning-bg)", border: "var(--warning-border)" },
  { value: "curry_only", label: "Curry Only", qty: 0.5, color: "var(--warning)", bg: "var(--warning-bg)", border: "var(--warning-border)" },
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
    { name: "", breakfast: 0, breakfastType: "full", lunch: 0, lunchType: "full", dinner: 0, dinnerType: "full", sharedWith: [] },
  ]);
  const [expandedShare, setExpandedShare] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const today = todayStr;
  const maxDate = maxDateStr;

  const updateGuest = (index: number, field: keyof GuestEntry, value: string | number | string[]) => {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const setMealSlot = (index: number, slot: "breakfast" | "lunch" | "dinner", mealType: MealType) => {
    setGuests((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const field = slot === "breakfast" ? "breakfastType" : slot === "lunch" ? "lunchType" : "dinnerType";
        const qtyField = slot === "breakfast" ? "breakfast" : slot === "lunch" ? "lunch" : "dinner";
        const currentType = g[field];
        const currentQty = g[qtyField];
        const opt = mealOptions.find((o) => o.value === mealType)!;
        const isSame = currentQty === opt.qty && currentType === mealType;
        return { ...g, [qtyField]: isSame ? 0 : opt.qty, [field]: isSame ? "full" : mealType };
      })
    );
  };

  const addGuest = () => {
    setGuests((prev) => [...prev, { name: "", breakfast: 0, breakfastType: "full", lunch: 0, lunchType: "full", dinner: 0, dinnerType: "full", sharedWith: [] }]);
  };

  const removeGuest = (index: number) => {
    setGuests((prev) => prev.filter((_, i) => i !== index));
    setExpandedShare((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const canSubmit = guests.every((g) => g.name.trim() && (g.breakfast > 0 || g.lunch > 0 || g.dinner > 0));

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
          breakfast: g.breakfast,
          breakfast_type: g.breakfastType,
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

  const renderMealSelector = (guestIdx: number, slot: "breakfast" | "lunch" | "dinner") => {
    const guest = guests[guestIdx];
    const field = slot === "breakfast" ? "breakfast" : slot === "lunch" ? "lunch" : "dinner";
    const typeField = slot === "breakfast" ? "breakfastType" : slot === "lunch" ? "lunchType" : "dinnerType";
    const currentQty = guest[field];
    const currentType = guest[typeField];

    return (
      <div className={`flex-1 rounded-[16px] p-3.5 md:p-4 space-y-2.5 border ${
        slot === "breakfast" ? "bg-breakfast-bg border-breakfast-border" : slot === "lunch" ? "bg-lunch-bg border-lunch-border" : "bg-dinner-bg border-dinner-border"
      }`} style={{ borderWidth: "1.5px" }}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${slot === "breakfast" ? "bg-breakfast" : slot === "lunch" ? "bg-lunch" : "bg-dinner"}`} />
          <p className={`text-[13px] md:text-[14px] font-bold capitalize ${slot === "breakfast" ? "text-breakfast" : slot === "lunch" ? "text-lunch" : "text-dinner"}`}>{slot}</p>
        </div>
        <div className="space-y-1.5">
          {mealOptions.map((opt) => {
            const isActive = currentQty > 0 && currentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMealSlot(guestIdx, slot, opt.value)}
                className={`w-full py-2 md:py-2.5 rounded-[12px] text-[12px] md:text-[13px] font-bold transition-all duration-200 border ${
                  isActive
                    ? "text-white border-transparent shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:scale-[1.02]"
                }`}
                style={isActive ? { background: opt.color, borderColor: opt.color } : undefined}
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
    <div className="min-h-screen">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-2">
          <Link
            href="/dashboard/user"
            className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Request Guest Meal</h1>
            <p className="text-[13px] md:text-[15px] text-muted-foreground">Add guests to have meals with you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pt-2 pb-8">
          {/* Hero Section - Two Columns on Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left Card - Illustration */}
            <div className="bg-card rounded-[24px] p-6 md:p-8 shadow-[0_2px_12px_rgba(30,30,60,0.04)] md:hover:-translate-y-[2px] md:transition-all md:duration-300 flex flex-col items-center justify-center text-center">
              <svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px] mb-5">
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
              <h2 className="text-[18px] md:text-[20px] font-bold text-foreground mb-2">Add guests to have meals with you</h2>
              <p className="text-[13px] md:text-[14px] text-muted-foreground leading-relaxed">You can request meals for one or multiple days.</p>
            </div>

            {/* Right Card - Duration & Date */}
            <div className="bg-card rounded-[24px] p-5 md:p-6 shadow-[0_2px_12px_rgba(30,30,60,0.04)] md:hover:-translate-y-[2px] md:transition-all md:duration-300 flex flex-col gap-5">
              {/* Duration */}
              <div>
                <label className="block text-[13px] md:text-[14px] font-semibold text-muted-foreground mb-2.5">Duration</label>
                <div className="flex gap-2 bg-muted rounded-[14px] p-1.5">
                  {(["one_day", "multi_day"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`flex-1 py-2.5 md:py-3 rounded-[12px] text-[13px] md:text-[14px] font-bold transition-all duration-200 ${
                        duration === d
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d === "one_day" ? "One Day" : "Multiple Days"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Picker */}
              <div className="flex-1">
                <label className="block text-[13px] md:text-[14px] font-semibold text-muted-foreground mb-2.5">
                  {duration === "one_day" ? "Date" : "From"}
                </label>
                {duration === "one_day" ? (
                  <div className="h-[52px]">
                    <DatePickerField value={date} onChange={setDate} min={today} max={maxDate} className="!h-[52px] !rounded-[14px] !border-border !text-[15px] font-semibold" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-[52px]">
                      <DatePickerField value={startDate} onChange={setStartDate} min={today} max={maxDate} className="!h-[52px] !rounded-[14px] !border-border !text-[15px] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[13px] md:text-[14px] font-semibold text-muted-foreground mb-2.5">To</label>
                      <div className="h-[52px]">
                        <DatePickerField value={endDate} onChange={setEndDate} min={startDate} max={maxDate} className="!h-[52px] !rounded-[14px] !border-border !text-[15px] font-semibold" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-day preview */}
              {duration === "multi_day" && (
                <div className="bg-muted rounded-[14px] px-4 py-2.5 flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6A4FD8" strokeWidth="1.8" />
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="#6A4FD8" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span className="text-[12px] md:text-[13px] font-semibold text-primary">
                    {eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).length} day{eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) }).length > 1 ? "s" : ""} selected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Guests Section */}
          <div className="bg-card rounded-[24px] shadow-[0_2px_12px_rgba(30,30,60,0.04)] overflow-hidden">
            {/* Guests Header */}
            <div className="px-5 md:px-6 py-4 border-b border-border">
              <h3 className="text-[16px] md:text-[18px] font-bold text-foreground">Guests</h3>
            </div>

            {/* Guest Entries */}
            <div className="divide-y divide-border">
              {guests.map((guest, idx) => (
                <div key={idx} className="p-4 md:p-6 space-y-4">
                  {/* Guest Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-primary">{idx + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={guest.name}
                      onChange={(e) => updateGuest(idx, "name", e.target.value)}
                      placeholder={`Guest ${idx + 1} name`}
                      className="flex-1 h-[52px] bg-muted border border-border rounded-[14px] px-4 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                    {guests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuest(idx)}
                        className="w-9 h-9 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0 hover:bg-[#fecaca] transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6L18 18M6 18L18 6" stroke="#e5484d" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Meal Selectors - Side by Side on Desktop */}
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                    {renderMealSelector(idx, "breakfast")}
                    {renderMealSelector(idx, "lunch")}
                    {renderMealSelector(idx, "dinner")}
                  </div>

                  {/* Share Cost */}
                  {(guest.breakfast > 0 || guest.lunch > 0 || guest.dinner > 0) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedShare((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] md:text-[14px] font-semibold transition-colors border border-border bg-muted text-primary hover:bg-muted"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
                        <div className="mt-2 bg-card border border-border rounded-[14px] overflow-hidden">
                          {members.length === 0 ? (
                            <p className="text-[12px] md:text-[13px] text-muted-foreground p-4">No other members in this mess</p>
                          ) : (
                            <>
                              {/* Search Input */}
                              <div className="sticky top-0 bg-card px-3 py-2 border-b border-border">
                                <div className="relative">
                                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={searchQuery[idx] || ""}
                                    onChange={(e) => setSearchQuery((prev) => ({ ...prev, [idx]: e.target.value }))}
                                    placeholder="Search member..."
                                    className="w-full pl-9 pr-3 py-2 text-[13px] outline-none text-foreground placeholder:text-muted-foreground bg-muted rounded-[10px] border border-transparent focus:border-primary focus:bg-card transition-colors"
                                  />
                                </div>
                              </div>
                              
                              {/* Members List */}
                              <div className="max-h-[200px] overflow-y-auto">
                                {members
                                  .filter((m) => (m.name || "Unknown").toLowerCase().includes((searchQuery[idx] || "").toLowerCase()))
                                  .map((m) => (
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
                                      className="flex items-center gap-3 py-2.5 px-3 hover:bg-muted cursor-pointer transition-colors"
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-colors ${
                                          guest.sharedWith.includes(m.user_id)
                                            ? "bg-primary border-primary"
                                            : "border-[ccc]"
                                        }`}
                                      >
                                        {guest.sharedWith.includes(m.user_id) && (
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-[14px] font-medium text-foreground">{m.name || "Unknown"}</span>
                                    </div>
                                  ))}
                                {members.filter((m) => (m.name || "Unknown").toLowerCase().includes((searchQuery[idx] || "").toLowerCase())).length === 0 && (
                                  <p className="text-[12px] md:text-[13px] text-muted-foreground p-4 text-center">No members found</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Guest Button */}
            <div className="px-5 md:px-6 py-4">
              <button
                type="button"
                onClick={addGuest}
                className="w-full border-[1.5px] border-dashed border-border rounded-[14px] py-3 text-[14px] font-bold text-primary flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                Add Guest
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted rounded-[18px] p-4 md:p-5 flex items-start gap-3 border border-border">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 11V17" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1.3" fill="#fff" />
              </svg>
            </div>
            <p className="text-[13px] md:text-[14px] text-muted-foreground leading-relaxed">
              Guest meals require manager approval. You can request up to 7 days in advance. Use &quot;Share cost&quot; to split the meal expense with another member.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full md:w-auto md:min-w-[280px] h-[52px] bg-primary text-primary-foreground rounded-[14px] text-[15px] md:text-[16px] font-bold flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
