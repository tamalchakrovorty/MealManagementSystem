"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addMonths, subMonths } from "date-fns";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

function MobileMonthPicker({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val && /^\d{4}-\d{2}$/.test(val)) {
      params.set("month", val);
      router.push(`?${params.toString()}`);
    } else if (!val) {
      params.delete("month");
      router.push(`?${params.toString()}`);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 bg-white rounded-[14px] px-4 py-3 shadow-[0_2px_6px_rgba(30,30,60,0.06)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6a4fd8] shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <style>{`.mobile-month-input::-webkit-calendar-picker-indicator { filter: invert(38%) sepia(90%) saturate(1500%) hue-rotate(240deg) brightness(95%) contrast(95%); }`}</style>
        <input
          type="month"
          value={currentMonth}
          onChange={handleChange}
          className="mobile-month-input text-[14px] font-semibold text-[#6a4fd8] outline-none bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
}

function DesktopMonthPicker({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [current, setCurrent] = useState(() => {
    const [y, m] = currentMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const displayLabel = format(current, "MMMM, yyyy");

  const navigate = (dir: "prev" | "next") => {
    const newDate = dir === "prev" ? subMonths(current, 1) : addMonths(current, 1);
    setCurrent(newDate);
    const val = format(newDate, "yyyy-MM");
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", val);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-[14px] px-3 py-2 shadow-[0_2px_6px_rgba(30,30,60,0.06)]">
      <button
        onClick={() => navigate("prev")}
        className="w-9 h-9 rounded-full bg-[#f4f4fb] hover:bg-[#ece9fe] flex items-center justify-center transition-colors"
      >
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
      <button
        onClick={() => navigate("next")}
        className="w-9 h-9 rounded-full bg-[#f4f4fb] hover:bg-[#ece9fe] flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L15 12L9 18" stroke="#6a4fd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function MonthPickerInner({ currentMonth }: { currentMonth: string }) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DesktopMonthPicker currentMonth={currentMonth} />
  ) : (
    <MobileMonthPicker currentMonth={currentMonth} />
  );
}

export function MonthPicker({ currentMonth }: { currentMonth: string }) {
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
