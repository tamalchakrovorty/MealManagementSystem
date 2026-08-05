"use client";

import { useState, useRef, useEffect } from "react";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(val: string): { day: number; month: number; year: number } {
  if (!val) {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
  }
  const [y, m, d] = val.split("-").map(Number);
  return { day: d, month: m - 1, year: y };
}

function toISO(day: number, month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month: number, year: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

interface DatePickerFieldProps {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePickerField({ value, onChange, min, max, className }: DatePickerFieldProps) {
  const { day, month, year } = parseDate(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(month);
  const [viewYear, setViewYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setViewMonth(month);
      setViewYear(year);
    }
  }, [open, month, year]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const minDate = min ? parseDate(min) : null;
  const maxDate = max ? parseDate(max) : null;

  const today = new Date();
  const todayStr = toISO(today.getDate(), today.getMonth(), today.getFullYear());

  const safeDay = Math.min(day, daysInMonth(month, year));
  const display = value
    ? `${String(safeDay).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}/${year}`
    : "dd/mm/yyyy";

  const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
  const totalDays = daysInMonth(viewMonth, viewYear);
  const prevMonthDays = daysInMonth(viewMonth === 0 ? 11 : viewMonth - 1, viewMonth === 0 ? viewYear - 1 : viewYear);

  const cells: { day: number; month: number; year: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: prevMonthDays - i, month: m, year: y, current: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: d, month: m, year: y, current: false });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (cell: { day: number; month: number; year: number }) => {
    const iso = toISO(cell.day, cell.month, cell.year);
    const minStr = minDate ? toISO(minDate.day, minDate.month, minDate.year) : null;
    const maxStr = maxDate ? toISO(maxDate.day, maxDate.month, maxDate.year) : null;
    if (minStr && iso < minStr) return;
    if (maxStr && iso > maxStr) return;
    onChange(iso);
    setOpen(false);
  };

  const isDisabled = (cell: { day: number; month: number; year: number }) => {
    const iso = toISO(cell.day, cell.month, cell.year);
    const minStr = minDate ? toISO(minDate.day, minDate.month, minDate.year) : null;
    const maxStr = maxDate ? toISO(maxDate.day, maxDate.month, maxDate.year) : null;
    if (minStr && iso < minStr) return true;
    if (maxStr && iso > maxStr) return true;
    return false;
  };

  const isSelected = (cell: { day: number; month: number; year: number }) => {
    return value === toISO(cell.day, cell.month, cell.year);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm text-left outline-none focus:border-[#6a4fd8] transition-colors bg-white ${className || ""}`}
      >
        <span className={value ? "text-[#333]" : "text-[#aaa]"}>{display}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white rounded-xl border border-[#e3e0f5] shadow-lg p-3 w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#666] hover:bg-[#f4f4fb]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[13px] font-bold text-[#333]">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#666] hover:bg-[#f4f4fb]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-[#8b8fa3] py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell, i) => {
              const selected = isSelected(cell);
              const todayMatch = toISO(cell.day, cell.month, cell.year) === todayStr;
              const disabled = isDisabled(cell);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(cell)}
                  disabled={disabled}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-[12px] font-semibold transition-all
                    ${selected ? "bg-[#6a4fd8] text-white" : todayMatch ? "bg-[#ece9fe] text-[#6a4fd8] font-bold" : cell.current ? "text-[#333] hover:bg-[#f4f4fb]" : "text-[#ccc]"}
                    ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
