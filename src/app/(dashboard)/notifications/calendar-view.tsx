"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
} from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BAZAR_COLOR = "#c8790b";
const BAZAR_BG = "#fdeccb";
const EVENT_COLOR = "#d98a1c";
const EVENT_BG = "#fff2df";
const ACTIVITY_COLOR = "#6a4fd8";
const ACTIVITY_BG = "#ede9fe";

export function CalendarView({ events, bazarDuties, activityLogs }: { events: any[]; bazarDuties: any[]; activityLogs: any[] }) {
  const [month, setMonth] = useState<Date | null>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  if (!month) return null;

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const itemsByDate = new Map<string, any[]>();
  for (const ev of events) {
    const rawDate = ev.event_date;
    const d = typeof rawDate === "string" ? rawDate.split("T")[0] : format(rawDate, "yyyy-MM-dd");
    if (!itemsByDate.has(d)) itemsByDate.set(d, []);
    itemsByDate.get(d)!.push({ ...ev, _kind: "event" });
  }
  for (const bd of bazarDuties) {
    const rawDate = bd.assigned_date;
    const d = typeof rawDate === "string" ? rawDate.split("T")[0] : format(rawDate, "yyyy-MM-dd");
    if (!itemsByDate.has(d)) itemsByDate.set(d, []);
    itemsByDate.get(d)!.push({
      id: `bazar-${bd.id}`,
      _kind: "bazar",
      user_name: bd.user_name || "Member",
      assigned_date: d,
    });
  }
  for (const [idx, log] of activityLogs.entries()) {
    const rawDate = log.created_at;
    const d = typeof rawDate === "string" ? rawDate.split("T")[0] : format(rawDate, "yyyy-MM-dd");
    if (!itemsByDate.has(d)) itemsByDate.set(d, []);
    const label = log.type === "join_accepted" ? "Joined" : log.type === "leave" ? "Left" : "Removed";
    itemsByDate.get(d)!.push({
      id: `activity-${d}-${log.type}-${idx}`,
      _kind: "activity",
      message: log.message,
      label,
    });
  }

  const selectedItems = selectedDay
    ? itemsByDate.get(format(selectedDay, "yyyy-MM-dd")) || []
    : [];

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-card rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,.04)]">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setMonth(addMonths(month, -1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="text-[15px] md:text-[17px] font-bold capitalize">{format(month, "MMMM yyyy")}</span>
          <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d} className="text-center text-[10px] md:text-[12px] font-bold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, month);
            const today = isToday(day);
            const dateStr = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDate.get(dateStr) || [];
            const hasItems = dayItems.length > 0;
            const hasEv = dayItems.some((i) => i._kind === "event");
            const hasBz = dayItems.some((i) => i._kind === "bazar");
            const hasAc = dayItems.some((i) => i._kind === "activity");
            const selected = selectedDay && isSameDay(day, selectedDay);

            let cellBg = "";
            let cellText = "";
            if (selected) {
              cellBg = "bg-primary";
              cellText = "text-primary-foreground font-bold";
            } else if (today && !hasItems) {
              cellBg = "bg-primary/10";
              cellText = "text-primary font-bold";
            } else if (hasAc) {
              cellBg = "bg-[#ede9fe] border border-[#6a4fd844]";
              cellText = "text-primary";
            } else if (hasEv && hasBz) {
              cellBg = "bg-gradient-to-br from-[#fff2df] to-[#fdeccb] border border-[#c8790b44]";
              cellText = "text-[#c8790b]";
            } else if (hasBz) {
              cellBg = "bg-[#fdeccb] border border-[#c8790b44]";
              cellText = "text-[#c8790b]";
            } else if (hasEv) {
              cellBg = "bg-[#fff2df] border border-[#d98a1c44]";
              cellText = "text-[#d98a1c]";
            } else if (inMonth) {
              cellBg = "hover:bg-muted";
              cellText = "text-foreground";
            } else {
              cellText = "text-[#ccc]";
            }

            return (
              <button key={day.toISOString()} type="button" onClick={() => setSelectedDay(day)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${cellBg} ${cellText}`}
              >
                <span className="text-[12px] md:text-[13px] font-bold">{format(day, "d")}</span>
                {hasItems && (
                  <span className="text-[8px] md:text-[10px] leading-none mt-0.5 flex gap-0.5">
                    {hasEv && <span style={{ color: selected ? "#fff" : EVENT_COLOR }}>📅</span>}
                    {hasBz && <span style={{ color: selected ? "#fff" : BAZAR_COLOR }}>🛒</span>}
                    {hasAc && <span style={{ color: selected ? "#fff" : ACTIVITY_COLOR }}>👤</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-primary/10 border border-[#6a4fd844]" />
            <span className="text-[10px] md:text-[12px] font-semibold text-muted-foreground">📅 Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#d98a1c]/10 border border-[#d98a1c44]" />
            <span className="text-[10px] md:text-[12px] font-semibold text-muted-foreground">📅 Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#fdeccb] border border-[#c8790b44]" />
            <span className="text-[10px] md:text-[12px] font-semibold text-muted-foreground">🛒 Bazar Duty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#ede9fe] border border-[#6a4fd844]" />
            <span className="text-[10px] md:text-[12px] font-semibold text-muted-foreground">👤 Activity</span>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-foreground">
              {selectedDay ? format(selectedDay, "EEEE, d MMM") : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedItems.length > 0 ? (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {selectedItems.map((item: any) =>
                item._kind === "bazar" ? (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: BAZAR_BG }}>
                    <span className="text-[16px] leading-none mt-0.5">🛒</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold" style={{ color: BAZAR_COLOR }}>Bazar Duty</span>
                      <p className="text-[13px] font-semibold text-foreground mt-0.5 leading-snug">{item.user_name}</p>
                    </div>
                  </div>
                ) : item._kind === "activity" ? (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: ACTIVITY_BG }}>
                    <span className="text-[16px] leading-none mt-0.5">👤</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold" style={{ color: ACTIVITY_COLOR }}>{item.label}</span>
                      <p className="text-[13px] font-semibold text-foreground mt-0.5 leading-snug">{item.message}</p>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: EVENT_BG }}>
                    <span className="text-[16px] leading-none mt-0.5">📅</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold" style={{ color: EVENT_COLOR }}>Event</span>
                        {item.author_name && <span className="text-[10px] text-muted-foreground">by {item.author_name}</span>}
                      </div>
                      <p className="text-[13px] font-semibold text-foreground mt-0.5 leading-snug">{item.title}</p>
                      {item.description && <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No events on this day</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
