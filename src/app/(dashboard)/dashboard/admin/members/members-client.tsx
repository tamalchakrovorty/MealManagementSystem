"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { popup } from "@/lib/popup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Member {
  user_id: string;
  mess_id: string;
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
  updated_at: string;
  details: any;
}

export function MembersListClient({
  members,
  leftMembers,
  removedMembers,
  leaveRequests,
  rejectedLeaveRequests,
  mealRate,
  memberStats,
  currentUserId,
  isManager,
}: {
  members: Member[];
  leftMembers: Member[];
  removedMembers: Member[];
  leaveRequests: LeaveRequest[];
  rejectedLeaveRequests: LeaveRequest[];
  mealRate: number;
  memberStats: Record<string, MemberStats>;
  currentUserId: string;
  isManager: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"current" | "left" | "removed" | "rejected">("current");
  const [pendingAction, setPendingAction] = useState<{ type: "approve" | "reject"; req: LeaveRequest } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
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

  const handleRemove = async () => {
    if (!memberToRemove) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mess_id: memberToRemove.mess_id, userId: memberToRemove.user_id }),
      });
      if (!res.ok) {
        const d = await res.json();
        popup.error(d.error || "Something went wrong");
      } else {
        popup.success(`${memberToRemove.name || "Member"} has been removed`);
        setMemberToRemove(null);
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
      {/* Tabs */}
      <div className="flex rounded-[14px] bg-[#f2f1fb] p-1 gap-1 md:justify-center">
        {([
          { key: "current", label: "Current", count: members.length },
          { key: "left", label: "Left", count: leftMembers.length },
          { key: "removed", label: "Removed", count: removedMembers.length },
          { key: "rejected", label: "Rejected", count: rejectedLeaveRequests.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors ${
              activeTab === tab.key ? "bg-[#6a4fd8] text-white" : "text-[#6a4fd8]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-[13px] font-bold ${activeTab === tab.key ? "text-white/80" : "text-[#6a4fd8]/60"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current Members */}
      {activeTab === "current" && (
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
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
                {leaveReq && isManager && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#6a4fd8]">
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
                  {isManager && m.user_id !== currentUserId && (
                    <div className="flex items-center gap-2 mt-2.5 pl-14">
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMemberToRemove(m); }}
                        disabled={loading}
                        className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#fadada] text-[#e5484d] disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {leaveReq && isManager && (
                    <div className="mt-2.5 pl-14 rounded-xl p-3" style={{ background: "rgba(106, 79, 216, 0.08)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-bold text-[#6a4fd8]">
                          Leave Request · ৳ {balanceOf(leaveReq).toFixed(0)}
                        </span>
                        <span className="text-[11px] text-[#6a4fd8]/60">
                          {format(new Date(leaveReq.created_at), "d MMM, h:mm a")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingAction({ type: "reject", req: leaveReq })}
                          disabled={loading}
                          className="flex-1 text-xs font-bold px-3 py-2 rounded-lg bg-[#fadada] text-[#e5484d] disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ type: "approve", req: leaveReq })}
                          disabled={loading}
                          className="flex-1 text-xs font-bold px-3 py-2 rounded-lg bg-[#d6f3e4] text-[#1fae70] disabled:opacity-60"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Left Members */}
      {activeTab === "left" && (
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <p className="text-sm text-[#999] mb-3">{leftMembers.length} members who left</p>
          {leftMembers.length === 0 ? (
            <p className="text-sm text-[#bbb] text-center py-6">No members have left yet.</p>
          ) : (
            <div className="space-y-3">
              {leftMembers.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 border-b border-[#f0f0f5] pb-3 last:border-0 last:pb-0">
                  <Avatar member={m} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#333] truncate block">{m.name || "Unknown"}</span>
                    <span className="text-xs text-[#bbb]">Left {m.joined_at ? format(new Date(m.joined_at), "d MMM yyyy") : "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f0f5] text-[#8b8fa3]">Left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Removed Members */}
      {activeTab === "removed" && (
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <p className="text-sm text-[#999] mb-3">{removedMembers.length} removed members</p>
          {removedMembers.length === 0 ? (
            <p className="text-sm text-[#bbb] text-center py-6">No members have been removed.</p>
          ) : (
            <div className="space-y-3">
              {removedMembers.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 border-b border-[#f0f0f5] pb-3 last:border-0 last:pb-0">
                  <Avatar member={m} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#333] truncate block">{m.name || "Unknown"}</span>
                    <span className="text-xs text-[#bbb]">Removed {m.joined_at ? format(new Date(m.joined_at), "d MMM yyyy") : "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fadada] text-[#e5484d]">Removed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejected Leave Requests */}
      {activeTab === "rejected" && (
        <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <p className="text-sm text-[#999] mb-3">{rejectedLeaveRequests.length} rejected leave requests</p>
          {rejectedLeaveRequests.length === 0 ? (
            <p className="text-sm text-[#bbb] text-center py-6">No rejected leave requests.</p>
          ) : (
            <div className="space-y-3">
              {rejectedLeaveRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-[#f0f0f5] pb-3 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-[#6a4fd8] flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      r.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#333] truncate block">{r.name || "Unknown"}</span>
                    <span className="text-xs text-[#bbb]">{r.updated_at ? format(new Date(r.updated_at), "d MMM yyyy") : "—"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fadada] text-[#e5484d]">Rejected</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                {selectedLeaveReq && isManager && (
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

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => { if (!open && !loading) setMemberToRemove(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-[#333]">Remove Member?</DialogTitle>
            <DialogDescription className="text-[13px] text-[#666]">
              Are you sure you want to remove <strong>{memberToRemove?.name || "this member"}</strong> from the mess? They will lose access immediately. All their data will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={loading} onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button
              disabled={loading}
              onClick={handleRemove}
              className="bg-[#e5484d] hover:bg-[#e5484d]"
            >
              {loading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
