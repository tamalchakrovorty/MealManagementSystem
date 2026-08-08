"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";

function fmtDate(val: string | Date): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val + "T00:00:00") : val;
  return format(d, "d MMM yyyy");
}

type TabType = "assign" | "pending" | "completed";

interface Member {
  user_id: string;
  name: string;
  phone: string;
  role: string;
  avatar_url: string | null;
}

interface BazarDuty {
  id: string;
  user_id: string;
  assigned_date: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  user_name: string;
  avatar_url: string | null;
}

export function MembersTab({
  messId,
  members,
  pendingMembers,
  bazarDuties,
}: {
  messId: string;
  members: Member[];
  pendingMembers: any[];
  bazarDuties: BazarDuty[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("assign");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [assigning, setAssigning] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [duties, setDuties] = useState<BazarDuty[]>(bazarDuties);

  useEffect(() => {
    setDuties(bazarDuties);
  }, [bazarDuties]);

  const pendingDuties = duties.filter((d) => d.status === "pending");
  const completedDuties = duties.filter((d) => d.status === "completed");

  const handleAssign = async (userId: string) => {
    setAssigning(userId);
    try {
      const res = await fetch("/api/admin/bazar-duty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assignedDate: selectedDate }),
      });
      if (!res.ok) {
        const d = await res.json();
        popup.error(d.error || "Failed to assign");
      } else {
        popup.success("Bazar duty assigned");
        router.refresh();
      }
    } finally {
      setAssigning(null);
    }
  };

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      const res = await fetch("/api/admin/bazar-duty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json();
        popup.error(d.error || "Failed to complete");
      } else {
        popup.success("Marked as completed");
        router.refresh();
      }
    } finally {
      setCompleting(null);
    }
  };

  const roleColor = (role: string) => {
    if (role === "manager") return "bg-primary/10 text-primary";
    if (role === "moderator") return "bg-[#fbe4cf] text-[#d98a1c]";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tabs */}
      <div className="bg-muted rounded-[14px] p-1.5 flex">
        {(["assign", "pending", "completed"] as TabType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 md:py-3 rounded-[10px] text-[12px] md:text-[13px] font-bold transition-all capitalize ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "assign" && "Assign Bazar"}
            {t === "pending" && `Pending (${pendingDuties.length})`}
            {t === "completed" && `Completed (${completedDuties.length})`}
          </button>
        ))}
      </div>

      {/* Assign Bazar Tab */}
      {tab === "assign" && (
        <div className="space-y-3">
          {/* Date Picker */}
          <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <label className="text-[13px] font-bold text-muted-foreground mb-2 block">Assign for Date</label>
            <DatePickerField value={selectedDate} onChange={setSelectedDate} className="w-full font-semibold" />
          </div>

          {/* Members List */}
          <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <h3 className="text-[15px] font-bold mb-3">Members ({members.length})</h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 relative">
                      {m.avatar_url ? (
                        <Image src={m.avatar_url} alt="" fill className="rounded-full object-cover" />
                      ) : (
                        m.name?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{m.phone || ""}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor(m.role)}`}>{m.role}</span>
                  </div>
                  <button
                    onClick={() => handleAssign(m.user_id)}
                    disabled={assigning === m.user_id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary disabled:opacity-50"
                  >
                    {assigning === m.user_id ? "..." : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Tab */}
      {tab === "pending" && (
        <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          {pendingDuties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending bazar duties</p>
          ) : (
            <div className="space-y-2">
              {pendingDuties.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 relative">
                      {d.avatar_url ? (
                        <Image src={d.avatar_url} alt="" fill className="rounded-full object-cover" />
                      ) : (
                        d.user_name?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.user_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Date: {fmtDate(d.assigned_date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleComplete(d.id)}
                    disabled={completing === d.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#d6f3e4] text-[#1fae70] disabled:opacity-50"
                  >
                    {completing === d.id ? "..." : "Complete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Tab */}
      {tab === "completed" && (
        <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          {completedDuties.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No completed bazar duties</p>
          ) : (
            <div className="space-y-2">
              {completedDuties.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0 relative">
                      {d.avatar_url ? (
                        <Image src={d.avatar_url} alt="" fill className="rounded-full object-cover" />
                      ) : (
                        d.user_name?.charAt(0)?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.user_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Date: {fmtDate(d.assigned_date)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground">
                    Done
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Members Section */}
      {tab === "assign" && pendingMembers.length > 0 && (
        <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <h3 className="text-[15px] font-bold mb-3">Pending Members</h3>
          <div className="space-y-2">
            {pendingMembers.map((m: any) => (
              <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{m.name || "Unknown"}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fbe9c9] text-[#d98a1c]">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
