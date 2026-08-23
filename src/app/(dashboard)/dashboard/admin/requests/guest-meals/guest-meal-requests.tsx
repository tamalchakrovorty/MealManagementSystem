"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { popup } from "@/lib/popup";

type FilterType = "all" | "pending" | "approved" | "rejected";

const MEAL_TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  rice_only: { label: "Rice Only", color: "#d98a1c", bg: "#fff2df" },
  curry_only: { label: "Curry Only", color: "#c47a20", bg: "#fef3e2" },
  full: { label: "Full Meal", color: "#1fae70", bg: "#e3faf0" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending: { color: "#d98a1c", bg: "#fff2df" },
  approved: { color: "#1fae70", bg: "#d9f2e0" },
  rejected: { color: "#e5484d", bg: "#fadada" },
};

export function GuestMealRequests({ requests, members }: { requests: any[]; members?: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleRequest = async (requestId: string, status: "approved" | "rejected") => {
    setLoading(requestId);
    const res = await fetch("/api/admin/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success(`Request ${status}`);
      router.refresh();
    }
    setLoading(null);
  };

  const getMemberName = (userId: string) => {
    const member = members?.find((m: any) => m.user_id === userId);
    return member?.name || userId;
  };

  const getBadge = (type: string) => MEAL_TYPE_BADGES[type] || MEAL_TYPE_BADGES.full;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card rounded-[18px] p-4 md:p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#fff2df] flex items-center justify-center mx-auto mb-2 transition-all">
            <span className="text-[15px] md:text-[17px] font-bold text-[#d98a1c]">{pending.length}</span>
          </div>
          <p className="text-[11px] md:text-[13px] font-semibold text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-[18px] p-4 md:p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#d9f2e0] flex items-center justify-center mx-auto mb-2 transition-all">
            <span className="text-[15px] md:text-[17px] font-bold text-[#1fae70]">{approved.length}</span>
          </div>
          <p className="text-[11px] md:text-[13px] font-semibold text-muted-foreground">Approved</p>
        </div>
        <div className="bg-card rounded-[18px] p-4 md:p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#fadada] flex items-center justify-center mx-auto mb-2 transition-all">
            <span className="text-[15px] md:text-[17px] font-bold text-[#e5484d]">{rejected.length}</span>
          </div>
          <p className="text-[11px] md:text-[13px] font-semibold text-muted-foreground">Rejected</p>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="bg-muted rounded-[14px] p-1.5 flex">
        {(["all", "pending", "approved", "rejected"] as FilterType[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 md:py-2.5 rounded-[10px] text-[12px] md:text-[13px] font-bold transition-all capitalize ${
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-[18px] p-8 md:p-12 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
          <p className="text-sm md:text-base text-muted-foreground">No {filter === "all" ? "" : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {filtered.map((req: any) => {
            const details = typeof req.details === "string" ? JSON.parse(req.details) : req.details;
            const guests = details?.guests || [];
            const allDates: string[] = details?.dates || (details?.date ? [details.date] : []);
            const dateStr = allDates.length === 1
              ? format(parseISO(allDates[0]), "d MMM, yyyy")
              : allDates.length > 1
                ? `${format(parseISO(allDates[0]), "d MMM")} - ${format(parseISO(allDates[allDates.length - 1]), "d MMM, yyyy")} (${allDates.length} days)`
                : null;
            const statusStyle = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const sharedWith = [...new Set<string>(guests.flatMap((g: any) => g.shared_with || []))];

            return (
              <div
                key={req.id}
                className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              >
                {/* Top: Brought by + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm md:text-base font-bold shrink-0">
                      {(req.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-foreground">{req.name || "Unknown"}</p>
                      {dateStr && (
                        <p className="text-[11px] md:text-[12px] text-muted-foreground mt-0.5">{dateStr}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                    style={{ color: statusStyle.color, background: statusStyle.bg }}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Guest Cards */}
                {guests.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {guests.map((g: any, i: number) => {
                      const breakfastBadge = g.breakfast > 0 ? getBadge(g.breakfast_type || "full") : null;
                      const lunchBadge = g.lunch > 0 ? getBadge(g.lunch_type || "full") : null;
                      const dinnerBadge = g.dinner > 0 ? getBadge(g.dinner_type || "full") : null;
                      return (
                        <div key={i} className="bg-muted/50 rounded-xl px-3 py-2.5 md:px-4 md:py-3">
                          <p className="text-[13px] font-semibold text-foreground mb-1.5">{g.name}</p>
                          <div className="flex gap-2">
                            {breakfastBadge && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#6a4fd8]">B:</span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: breakfastBadge.color, background: breakfastBadge.bg }}
                                >
                                  {breakfastBadge.label}
                                </span>
                              </div>
                            )}
                            {lunchBadge && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#1bbf7e]">L:</span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: lunchBadge.color, background: lunchBadge.bg }}
                                >
                                  {lunchBadge.label}
                                </span>
                              </div>
                            )}
                            {dinnerBadge && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#d98a1c]">D:</span>
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: dinnerBadge.color, background: dinnerBadge.bg }}
                                >
                                  {dinnerBadge.label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Shared With */}
                {sharedWith.length > 0 && (
                  <p className="text-[11px] md:text-[12px] text-primary font-medium mb-3">
                    Shared with: {sharedWith.map((id: string) => getMemberName(id)).join(", ")}
                  </p>
                )}

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, "approved")}
                      disabled={loading === req.id}
                      className="flex-1 py-2.5 md:py-3 rounded-xl text-[13px] md:text-[14px] font-bold bg-[#d9f2e0] text-[#1fae70] disabled:opacity-60 transition-all"
                    >
                      {loading === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, "rejected")}
                      disabled={loading === req.id}
                      className="flex-1 py-2.5 md:py-3 rounded-xl text-[13px] md:text-[14px] font-bold bg-[#fadada] text-[#e5484d] disabled:opacity-60 transition-all"
                    >
                      {loading === req.id ? "..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
