"use client";

import { useState, useEffect } from "react";
import { format, addDays, eachDayOfInterval, parseISO } from "date-fns";
import { popup } from "@/lib/popup";
import { DatePickerField } from "@/components/ui/date-picker-field";

type MealOption = "on" | "off" | "rice_only" | "curry_only";
type DurationType = "one_time" | "long_time";
type RequestStatus = "pending" | "approved" | null;

const OPTIONS: { value: MealOption; label: string; color: string; bg: string; icon: string }[] = [
  { value: "on", label: "On", color: "#1fae70", bg: "#e3faf0", icon: "✓" },
  { value: "off", label: "Off", color: "#e5484d", bg: "#fadada", icon: "✕" },
  { value: "rice_only", label: "Rice Only", color: "#d98a1c", bg: "#fff2df", icon: "🍚" },
  { value: "curry_only", label: "Curry Only", color: "#c47a20", bg: "#fef3e2", icon: "🍛" },
];

export function MealOffToggle({ messId }: { messId: string }) {
  const [duration, setDuration] = useState<DurationType>("one_time");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(addDays(new Date(), 6), "yyyy-MM-dd"));
  }, []);

  const [lunch, setLunch] = useState<MealOption>("on");
  const [dinner, setDinner] = useState<MealOption>("on");
  const [currentLunch, setCurrentLunch] = useState<MealOption>("on");
  const [currentDinner, setCurrentDinner] = useState<MealOption>("on");
  const [requestStatus, setRequestStatus] = useState<RequestStatus>(null);
  const [pendingLunch, setPendingLunch] = useState<MealOption | null>(null);
  const [pendingDinner, setPendingDinner] = useState<MealOption | null>(null);
  const [partOfCombined, setPartOfCombined] = useState(false);
  const [combinedDates, setCombinedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Button enabled when selection differs from the current approved status
  const hasChanges = lunch !== currentLunch || dinner !== currentDinner;
  const activeDate = duration === "one_time" ? date : startDate;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchData = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/user/meal-off?mess_id=${messId}&date=${activeDate}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!cancelled) {
          const cLunch = data.currentLunch || "on";
          const cDinner = data.currentDinner || "on";
          setCurrentLunch(cLunch);
          setCurrentDinner(cDinner);

          // If there is a pending request, show those values as the working selection
          if (data.requestStatus === "pending" && data.pendingLunch != null) {
            setLunch(data.pendingLunch);
            setDinner(data.pendingDinner);
            setPendingLunch(data.pendingLunch);
            setPendingDinner(data.pendingDinner);
          } else {
            setLunch(cLunch);
            setDinner(cDinner);
            setPendingLunch(null);
            setPendingDinner(null);
          }

          setRequestStatus(data.requestStatus || null);
          setPartOfCombined(data.partOfCombined || false);
          setCombinedDates(data.combinedDates || []);
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
  }, [activeDate, messId]);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const body: Record<string, any> = { mess_id: messId, lunch, dinner };
      if (duration === "one_time") {
        body.date = date;
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          popup.error("Invalid date range");
          setLoading(false);
          return;
        }
        body.dates = eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
      }

      const res = await fetch("/api/user/meal-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        popup.error(data.error || "Request failed");
        setLoading(false);
        return;
      }
      setRequestStatus("pending");
      setPendingLunch(lunch);
      setPendingDinner(dinner);
      setPartOfCombined(duration === "long_time");
      popup.success("Request sent to admin");
    } catch {
      popup.error("Failed to submit request");
    }
    setLoading(false);
  };

  const renderSlot = (slot: "lunch" | "dinner", value: MealOption) => {
    const slotColor = slot === "lunch" ? "#1bbf7e" : "#d98a1c";
    const isCurrent = slot === "lunch" ? value === currentLunch : value === currentDinner;
    const isPending = requestStatus === "pending" && (
      slot === "lunch" ? value === pendingLunch : value === pendingDinner
    );
    return (
      <div className="rounded-xl p-3" style={{ background: slot === "lunch" ? "#f0faf5" : "#fffbf5", border: `1.5px solid ${slot === "lunch" ? "#d5f5e5" : "#fde9c8"}` }}>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: slotColor }} />
          <h4 className="text-[13px] font-bold capitalize" style={{ color: slotColor }}>{slot}</h4>
          {requestStatus === "pending" && isPending && !isCurrent && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto bg-[#fff2df] text-[#d98a1c]">
              Pending
            </span>
          )}
          {isCurrent && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ color: OPTIONS.find((o) => o.value === value)?.color, background: OPTIONS.find((o) => o.value === value)?.bg }}
            >
              {value === "on" ? "Current" : OPTIONS.find((o) => o.value === value)?.label}
            </span>
          )}
          {!isCurrent && (!requestStatus || requestStatus !== "pending" || !isPending) && value === "on" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto bg-[#e3faf0] text-[#1fae70]">
              Selected
            </span>
          )}
          {!isCurrent && (!requestStatus || requestStatus !== "pending" || !isPending) && value !== "on" && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ color: OPTIONS.find((o) => o.value === value)?.color, background: OPTIONS.find((o) => o.value === value)?.bg }}
            >
              Selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={fetching}
              onClick={() => slot === "lunch" ? setLunch(opt.value) : setDinner(opt.value)}
              className="py-2 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 leading-tight"
              style={{
                background: value === opt.value ? opt.bg : "#fff",
                color: value === opt.value ? opt.color : "#8b8fa3",
                border: value === opt.value ? `1.5px solid ${opt.color}44` : "1.5px solid #eee",
              }}
            >
              <span className="block text-[12px] mb-0.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      {/* Duration Toggle */}
      <div className="bg-[#f4f4fb] rounded-xl p-1 flex">
        <button
          type="button"
          onClick={() => setDuration("one_time")}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
            duration === "one_time" ? "bg-white text-[#333] shadow-sm" : "text-[#8b8fa3]"
          }`}
        >
          One Time
        </button>
        <button
          type="button"
          onClick={() => setDuration("long_time")}
          className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all ${
            duration === "long_time" ? "bg-white text-[#333] shadow-sm" : "text-[#8b8fa3]"
          }`}
        >
          Long Time
        </button>
      </div>

      {/* Date Pickers */}
      {duration === "one_time" ? (
        <div>
          <label className="block text-[11px] font-semibold text-[#666] mb-1">Date</label>
          <DatePickerField value={date} onChange={setDate} className="w-full" />
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#666] mb-1">From</label>
            <DatePickerField value={startDate} onChange={setStartDate} className="w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#666] mb-1">To</label>
            <DatePickerField value={endDate} onChange={setEndDate} min={startDate} className="w-full" />
          </div>
        </div>
      )}

      {/* Status */}
      {requestStatus && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#666]">Request:</span>
          {requestStatus === "pending" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff2df] text-[#d98a1c]">Pending Approval</span>
          )}
          {requestStatus === "approved" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e3faf0] text-[#1fae70]">Approved</span>
          )}
        </div>
      )}

      {/* Combined request info */}
      {requestStatus === "pending" && partOfCombined && combinedDates.length > 1 && (
        <div className="bg-[#f4f0ff] rounded-xl px-3 py-2 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#6a4fd8" strokeWidth="1.8" />
            <path d="M12 8V13" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="#6a4fd8" />
          </svg>
          <span className="text-[11px] font-semibold text-[#6a4fd8]">
            Long-time request ({format(parseISO(combinedDates[0]), "d MMM")} – {format(parseISO(combinedDates[combinedDates.length - 1]), "d MMM")})
          </span>
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#6a4fd8] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#8b8fa3] ml-2">Loading...</span>
        </div>
      ) : (
        <>
          {renderSlot("lunch", lunch)}
          {renderSlot("dinner", dinner)}
          <button
            type="button"
            onClick={handleRequest}
            disabled={loading || !hasChanges}
            className="w-full bg-[#5b3fd6] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </>
      )}
    </div>
  );
}
