"use client";

import { useState, useEffect } from "react";
import { format, addDays, eachDayOfInterval, parseISO } from "date-fns";
import { popup } from "@/lib/popup";
import { DatePickerField } from "@/components/ui/date-picker-field";

type MealOption = "on" | "off" | "rice_only" | "curry_only";
type DurationType = "one_time" | "long_time";
type RequestStatus = "pending" | "approved" | null;

const OPTIONS: { value: MealOption; label: string; color: string; bg: string; icon: string }[] = [
  { value: "on", label: "On", color: "var(--success)", bg: "var(--success-bg)", icon: "✓" },
  { value: "off", label: "Off", color: "var(--danger)", bg: "var(--danger-bg)", icon: "✕" },
  { value: "rice_only", label: "Rice Only", color: "var(--warning)", bg: "var(--warning-bg)", icon: "🍚" },
  { value: "curry_only", label: "Curry Only", color: "var(--warning)", bg: "var(--warning-bg)", icon: "🍛" },
];

export function MealOffToggle({ messId }: { messId: string }) {
  const [duration, setDuration] = useState<DurationType>("one_time");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(addDays(new Date(), 6), "yyyy-MM-dd"));

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
    const isCurrent = slot === "lunch" ? value === currentLunch : value === currentDinner;
    const isPending = requestStatus === "pending" && (
      slot === "lunch" ? value === pendingLunch : value === pendingDinner
    );
    return (
      <div className={`rounded-[14px] md:rounded-[18px] p-3 md:p-4 border ${
        slot === "lunch" ? "bg-lunch-bg border-lunch-border" : "bg-dinner-bg border-dinner-border"
      }`} style={{ borderWidth: "1.5px" }}>
        <div className="flex items-center gap-1.5 mb-2.5 md:mb-3">
          <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${slot === "lunch" ? "bg-lunch" : "bg-dinner"}`} />
          <h4 className={`text-[13px] md:text-[15px] font-bold capitalize ${slot === "lunch" ? "text-lunch" : "text-dinner"}`}>{slot}</h4>
          {requestStatus === "pending" && isPending && !isCurrent && (
            <span className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ml-auto bg-warning-bg text-warning">
              Pending
            </span>
          )}
          {isCurrent && (
            <span
              className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ml-auto"
              style={{ color: OPTIONS.find((o) => o.value === value)?.color, background: OPTIONS.find((o) => o.value === value)?.bg }}
            >
              {value === "on" ? "Current" : OPTIONS.find((o) => o.value === value)?.label}
            </span>
          )}
          {!isCurrent && (!requestStatus || requestStatus !== "pending" || !isPending) && value === "on" && (
            <span className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ml-auto bg-success-bg text-success">
              Selected
            </span>
          )}
          {!isCurrent && (!requestStatus || requestStatus !== "pending" || !isPending) && value !== "on" && (
            <span
              className="text-[9px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ml-auto"
              style={{ color: OPTIONS.find((o) => o.value === value)?.color, background: OPTIONS.find((o) => o.value === value)?.bg }}
            >
              Selected
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 md:gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={fetching}
              onClick={() => slot === "lunch" ? setLunch(opt.value) : setDinner(opt.value)}
              className="py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-[13px] font-bold transition-all disabled:opacity-50 leading-tight"
              style={{
                background: value === opt.value ? opt.bg : "var(--card)",
                color: value === opt.value ? opt.color : "var(--muted-foreground)",
                border: value === opt.value ? `1.5px solid ${opt.color}44` : "1.5px solid var(--border)",
              }}
            >
              <span className="block text-[12px] md:text-[16px] mb-0.5">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Duration Toggle */}
      <div className="bg-muted rounded-[14px] md:rounded-[16px] p-1 md:p-1.5 flex">
        <button
          type="button"
          onClick={() => setDuration("one_time")}
          className={`flex-1 py-2 md:py-2.5 rounded-[12px] md:rounded-[14px] text-[12px] md:text-[14px] font-bold transition-all ${
            duration === "one_time" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          One Time
        </button>
        <button
          type="button"
          onClick={() => setDuration("long_time")}
          className={`flex-1 py-2 md:py-2.5 rounded-[12px] md:rounded-[14px] text-[12px] md:text-[14px] font-bold transition-all ${
            duration === "long_time" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Long Time
        </button>
      </div>

      {/* Date Pickers */}
      {duration === "one_time" ? (
        <div>
          <label className="block text-[11px] md:text-[13px] font-semibold text-muted-foreground mb-1.5">Date</label>
          <DatePickerField value={date} onChange={setDate} className="w-full !h-[42px] md:!h-[48px] !rounded-[12px] md:!rounded-[14px] !text-[13px] md:!text-[14px]" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <label className="block text-[11px] md:text-[13px] font-semibold text-muted-foreground mb-1.5">From</label>
            <DatePickerField value={startDate} onChange={setStartDate} className="w-full !h-[42px] md:!h-[48px] !rounded-[12px] md:!rounded-[14px] !text-[13px] md:!text-[14px]" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] md:text-[13px] font-semibold text-muted-foreground mb-1.5">To</label>
            <DatePickerField value={endDate} onChange={setEndDate} min={startDate} className="w-full !h-[42px] md:!h-[48px] !rounded-[12px] md:!rounded-[14px] !text-[13px] md:!text-[14px]" />
          </div>
        </div>
      )}

      {/* Status */}
      {requestStatus && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] md:text-[13px] font-semibold text-muted-foreground">Request:</span>
          {requestStatus === "pending" && (
            <span className="text-[10px] md:text-[12px] font-bold px-2 md:px-2.5 py-0.5 rounded-full bg-[#fff2df] text-[#d98a1c]">Pending Approval</span>
          )}
          {requestStatus === "approved" && (
            <span className="text-[10px] md:text-[12px] font-bold px-2 md:px-2.5 py-0.5 rounded-full bg-[#e3faf0] text-[#1fae70]">Approved</span>
          )}
        </div>
      )}

      {/* Combined request info */}
      {requestStatus === "pending" && partOfCombined && combinedDates.length > 1 && (
        <div className="bg-primary/10 rounded-[14px] md:rounded-[16px] px-3 md:px-4 py-2 md:py-2.5 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#6a4fd8" strokeWidth="1.8" />
            <path d="M12 8V13"             stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="#6a4fd8" />
          </svg>
          <span className="text-[11px] md:text-[13px] font-semibold text-primary">
            Long-time request ({format(parseISO(combinedDates[0]), "d MMM")} – {format(parseISO(combinedDates[combinedDates.length - 1]), "d MMM")})
          </span>
        </div>
      )}

      {fetching ? (
        <div className="flex items-center justify-center py-6 md:py-8">
          <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] md:text-[15px] text-muted-foreground ml-2">Loading...</span>
        </div>
      ) : (
        <>
          {renderSlot("lunch", lunch)}
          {renderSlot("dinner", dinner)}
          <button
            type="button"
            onClick={handleRequest}
            disabled={loading || !hasChanges}
            className="w-full bg-primary text-primary-foreground rounded-[14px] md:rounded-[16px] py-2.5 md:py-3 text-[14px] md:text-[15px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary/90 hover:shadow-md"
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </>
      )}
    </div>
  );
}
