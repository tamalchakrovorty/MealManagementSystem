"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { popup } from "@/lib/popup";

type FilterType = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending: { color: "#d98a1c", bg: "#fff2df" },
  approved: { color: "#1fae70", bg: "#d9f2e0" },
  rejected: { color: "#e5484d", bg: "#fadada" },
};

export function JoinRequests({ requests, messId }: { requests: any[]; messId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleApprove = async (requestId: string, userId: string) => {
    setLoading(requestId);
    const res = await fetch("/api/admin/requests/approve-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, mess_id: messId, userId }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Member approved and added");
      router.refresh();
    }
    setLoading(null);
  };

  const handleReject = async (requestId: string) => {
    setLoading(requestId);
    const res = await fetch("/api/admin/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status: "rejected" }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Request rejected");
      router.refresh();
    }
    setLoading(null);
  };

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
            const statusStyle = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const dateStr = req.created_at ? format(new Date(req.created_at), "d MMM, yyyy") : null;

            return (
              <div
                key={req.id}
                className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              >
                {/* Top: Name + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm md:text-base font-bold shrink-0">
                      {(req.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-semibold text-foreground">{req.name || "Unknown"}</p>
                      {dateStr && (
                        <p className="text-[11px] md:text-[12px] text-muted-foreground mt-0.5">Requested {dateStr}</p>
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

                {/* Info */}
                <div className="bg-muted/50 rounded-xl px-3 py-2.5 md:px-4 md:py-3 mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-[12px] font-semibold text-primary">Wants to join this mess</span>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id, req.user_id)}
                      disabled={loading === req.id}
                      className="flex-1 py-2.5 md:py-3 rounded-xl text-[13px] md:text-[14px] font-bold bg-[#d9f2e0] text-[#1fae70] disabled:opacity-60 transition-all"
                    >
                      {loading === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
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
