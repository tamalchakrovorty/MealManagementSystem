"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { popup } from "@/lib/popup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Member {
  user_id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

interface MemberStats {
  meals: number;
  deposits: number;
  balance: number;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  details: any;
}

export function MembersListClient({
  members,
  leaveRequests,
  mealRate,
  memberStats,
}: {
  members: Member[];
  leaveRequests: LeaveRequest[];
  mealRate: number;
  memberStats: Record<string, MemberStats>;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  const leaveMap = new Map<string, LeaveRequest>();
  for (const r of leaveRequests) leaveMap.set(r.user_id, r);

  const roleBadge = (role: string) => {
    if (role === "manager") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ece9fe] text-[#6a4fd8]">Manager</span>;
    if (role === "moderator") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dbeafe] text-[#2563eb]">Moderator</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f0f5] text-[#8b8fa3]">Member</span>;
  };

  const Avatar = ({ member, size }: { member: Member; size: string }) => (
    <div className={`${size} rounded-full bg-[#6a4fd8] flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden`}>
      {member.avatar_url ? (
        <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        member.name?.charAt(0)?.toUpperCase() || "?"
      )}
    </div>
  );

  const handleAction = async () => {
    if (!pendingAction) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: pendingAction.req.id,
          status: pendingAction.type === "approve" ? "approved" : "rejected",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        popup.error(d.error || "Something went wrong");
      } else {
        popup.success(pendingAction.type === "approve" ? "Leave request approved" : "Leave request rejected");
        setPendingAction(null);
        setSelectedMember(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const balanceOf = (req: LeaveRequest) => {
    const details = typeof req.details === "string" ? JSON.parse(req.details) : req.details;
    return Number(details?.balance || 0);
  };

  const stats = selectedMember ? memberStats[selectedMember.user_id] : null;
  const selectedLeaveReq = selectedMember ? leaveMap.get(selectedMember.user_id) : null;

  return (
    <>
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <p className="text-sm text-[#999] mb-3">{members.length} active members</p>
        <div className="space-y-3">
          {members.map((m) => {
            const leaveReq = leaveMap.get(m.user_id);
            return (
              <div key={m.user_id} className="border-b border-[#f0f0f5] pb-3 last:border-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedMember(m)}
                  className="w-full flex items-center gap-3 text-left cursor-pointer hover:bg-[#fafaff] rounded-xl -m-1 p-1 transition-colors"
                >
                  <Avatar member={m} size="w-11 h-11" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#333] truncate">{m.name || "Unknown"}</span>
                      {roleBadge(m.role)}
                      {leaveReq && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fbe9c9] text-[#c8790b]">
                          Leave Request · ৳ {balanceOf(leaveReq).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.phone && <span className="text-xs text-[#999]">{m.phone}</span>}
                      <span className="text-xs text-[#bbb]">Joined {format(new Date(m.joined_at), "d MMM yyyy")}</span>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#ccc]">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {leaveReq && (
                  <div className="flex items-center gap-2 mt-2.5 pl-14">
                    <span className="text-xs text-[#999]">
                      Requested {format(new Date(leaveReq.created_at), "d MMM, h:mm a")}
                    </span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => setPendingAction({ type: "reject", req: leaveReq })}
                      disabled={loading}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#fadada] text-[#e5484d] disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction({ type: "approve", req: leaveReq })}
                      disabled={loading}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#d6f3e4] text-[#1fae70] disabled:opacity-60"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => { if (!open && !loading) setSelectedMember(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white bg-[#6a4fd8]">
                    {selectedMember.avatar_url ? (
                      <img src={selectedMember.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedMember.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="text-center">
                    <DialogTitle className="text-[17px] font-bold text-[#333]">{selectedMember.name || "Unknown"}</DialogTitle>
                    <div className="flex justify-center mt-1.5">{roleBadge(selectedMember.role)}</div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Phone</span>
                  <span className="font-semibold text-[#333]">{selectedMember.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Joined</span>
                  <span className="font-semibold text-[#333]">{format(new Date(selectedMember.joined_at), "d MMM yyyy")}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Total Meals</span>
                  <span className="font-semibold text-[#333]">{stats ? stats.meals.toFixed(1) : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Total Deposit</span>
                  <span className="font-semibold text-[#333]">৳ {stats ? stats.deposits.toFixed(0) : "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Balance</span>
                  <span className={`font-bold ${stats && stats.balance < 0 ? "text-[#e5484d]" : "text-[#1fae70]"}`}>
                    ৳ {stats ? stats.balance.toFixed(0) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#999]">Meal Rate</span>
                  <span className="font-semibold text-[#333]">৳ {mealRate.toFixed(0)} / meal</span>
                </div>
                {selectedLeaveReq && (
                  <div className="mt-3 rounded-xl bg-[#fbe9c9] p-3">
                    <p className="text-[12px] font-bold text-[#c8790b] mb-1.5">
                      Pending Leave Request
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingAction({ type: "reject", req: selectedLeaveReq })}
                        disabled={loading}
                        className="flex-1 text-xs font-bold px-3 py-2 rounded-lg bg-[#fadada] text-[#e5484d] disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingAction({ type: "approve", req: selectedLeaveReq })}
                        disabled={loading}
                        className="flex-1 text-xs font-bold px-3 py-2 rounded-lg bg-[#d6f3e4] text-[#1fae70] disabled:opacity-60"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!pendingAction} onOpenChange={(open) => { if (!open && !loading) setPendingAction(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-[#333]">
              {pendingAction?.type === "approve" ? "Accept Leave Request?" : "Reject Leave Request?"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#666]">
              {pendingAction?.type === "approve"
                ? `Are you sure you want to accept ${pendingAction?.req.name || "this member"}'s request to leave the mess? They will be removed from the member list.`
                : `Are you sure you want to reject ${pendingAction?.req.name || "this member"}'s leave request?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleAction}
              className={pendingAction?.type === "approve" ? "bg-[#1fae70] hover:bg-[#1fae70]" : "bg-[#e5484d] hover:bg-[#e5484d]"}
            >
              {loading ? "Processing..." : pendingAction?.type === "approve" ? "Accept" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
