"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { popup } from "@/lib/popup";

type FilterType = "all" | "pending" | "approved" | "rejected";

const MEAL_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  off: { label: "OFF", color: "#e5484d", bg: "#fadada" },
  rice_only: { label: "Rice Only", color: "#d98a1c", bg: "#fff2df" },
  curry_only: { label: "Curry Only", color: "#c47a20", bg: "#fef3e2" },
  on: { label: "On", color: "#1fae70", bg: "#e3faf0" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending: { color: "#d98a1c", bg: "#fff2df" },
  approved: { color: "#1fae70", bg: "#d9f2e0" },
  rejected: { color: "#e5484d", bg: "#fadada" },
};

export function MealOffRequests({ requests }: { requests: any[] }) {
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

  const formatDate = (details: any) => {
    if (details?.dates?.length > 1) {
      const first = parseISO(details.dates[0]);
      const last = parseISO(details.dates[details.dates.length - 1]);
      return `${format(first, "d MMM")} – ${format(last, "d MMM, yyyy")}`;
    }
    if (details?.date) {
      return format(parseISO(details.date), "d MMM, yyyy");
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div className="w-9 h-9 rounded-full bg-[#fff2df] flex items-center justify-center mx-auto mb-2">
            <span className="text-[15px] font-bold text-[#d98a1c]">{pending.length}</span>
          </div>
          <p className="text-[11px] font-semibold text-[#8b8fa3]">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div className="w-9 h-9 rounded-full bg-[#d9f2e0] flex items-center justify-center mx-auto mb-2">
            <span className="text-[15px] font-bold text-[#1fae70]">{approved.length}</span>
          </div>
          <p className="text-[11px] font-semibold text-[#8b8fa3]">Approved</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div className="w-9 h-9 rounded-full bg-[#fadada] flex items-center justify-center mx-auto mb-2">
            <span className="text-[15px] font-bold text-[#e5484d]">{rejected.length}</span>
          </div>
          <p className="text-[11px] font-semibold text-[#8b8fa3]">Rejected</p>
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="bg-[#f4f4fb] rounded-[14px] p-1.5 flex">
        {(["all", "pending", "approved", "rejected"] as FilterType[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-[10px] text-[12px] font-bold transition-all capitalize ${
              filter === f ? "bg-white text-[#333] shadow-sm" : "text-[#8b8fa3]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <p className="text-sm text-[#999]">No {filter === "all" ? "" : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req: any) => {
            const details = typeof req.details === "string" ? JSON.parse(req.details) : req.details;
            const lunchBadge = MEAL_BADGES[details?.lunch || "on"];
            const dinnerBadge = MEAL_BADGES[details?.dinner || "on"];
            const statusStyle = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const dateStr = formatDate(details);
            const isCombined = details?.dates?.length > 1;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
              >
                {/* Top: Name + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#6a4fd8] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(req.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#333]">{req.name || "Unknown"}</p>
                      {dateStr && (
                        <p className="text-[11px] text-[#999] mt-0.5">
                          {isCombined && (
                            <svg className="inline-block mr-1 -mt-0.5" width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#999" strokeWidth="2" />
                              <path d="M3 10H21" stroke="#999" strokeWidth="2" />
                              <path d="M8 2V6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                              <path d="M16 2V6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          )}
                          {dateStr}
                        </p>
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

                {/* Meal Options */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "#f0faf5", border: "1px solid #d5f5e5" }}>
                    <p className="text-[10px] font-bold text-[#1bbf7e] mb-1">LUNCH</p>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: lunchBadge.color, background: lunchBadge.bg }}
                    >
                      {lunchBadge.label}
                    </span>
                  </div>
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "#fffbf5", border: "1px solid #fde9c8" }}>
                    <p className="text-[10px] font-bold text-[#d98a1c] mb-1">DINNER</p>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: dinnerBadge.color, background: dinnerBadge.bg }}
                    >
                      {dinnerBadge.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, "approved")}
                      disabled={loading === req.id}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-[#d9f2e0] text-[#1fae70] disabled:opacity-60 transition-all"
                    >
                      {loading === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, "rejected")}
                      disabled={loading === req.id}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-[#fadada] text-[#e5484d] disabled:opacity-60 transition-all"
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
