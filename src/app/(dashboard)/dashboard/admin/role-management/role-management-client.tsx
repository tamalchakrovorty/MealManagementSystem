"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";

export function RoleManagementClient({
  members, messId, currentUserId, isManager,
}: {
  members: any[]; messId: string; currentUserId: string; isManager: boolean;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [moderatorMember, setModeratorMember] = useState("");
  const [moderatorFrom, setModeratorFrom] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [moderatorUntil, setModeratorUntil] = useState(() => format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [transferMember, setTransferMember] = useState("");
  const [loadingModerator, setLoadingModerator] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const memberOptions = members.filter((m: any) => m.role !== "manager");

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <p className="text-sm text-[#999]">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAppointModerator = async () => {
    if (!moderatorMember || !isManager) return;
    if (!moderatorFrom || !moderatorUntil) {
      popup.error("Please select both start and end dates");
      return;
    }
    if (new Date(moderatorUntil) < new Date(moderatorFrom)) {
      popup.error("End date must be after start date");
      return;
    }
    setLoadingModerator(true);
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mess_id: messId,
        userId: moderatorMember,
        role: "moderator",
        moderatorFrom,
        moderatorUntil,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Moderator appointed");
      setModeratorMember("");
      router.refresh();
    }
    setLoadingModerator(false);
  };

  const handleTransferManager = async () => {
    if (!transferMember || !isManager) return;
    setLoadingTransfer(true);
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mess_id: messId, userId: transferMember, action: "transfer_manager" }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Managership transferred!");
      router.refresh();
    }
    setLoadingTransfer(false);
  };

  if (!isManager) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <p className="text-sm text-[#999]">Only the manager can manage roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Appoint Moderator */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#fbe4cf] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="3" stroke="#d98a1c" strokeWidth="1.8" />
              <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#d98a1c" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 10L17 12L21 8" stroke="#d98a1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#333]">Appoint Moderator</p>
            <p className="text-xs text-[#999] mt-1">Select a member to appoint as moderator. Moderators can help manage the mess.</p>
          </div>
        </div>

        <select
          value={moderatorMember}
          onChange={(e) => setModeratorMember(e.target.value)}
          className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors bg-white mb-4"
        >
          <option value="">Choose a member</option>
          {memberOptions.map((m: any) => (
            <option key={m.user_id} value={m.user_id}>{m.name || "Unknown"}</option>
          ))}
        </select>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#666] mb-1.5">From</label>
            <DatePickerField value={moderatorFrom} onChange={setModeratorFrom} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666] mb-1.5">Until</label>
            <DatePickerField value={moderatorUntil} onChange={setModeratorUntil} min={moderatorFrom} className="w-full" />
          </div>
        </div>

        <button
          onClick={handleAppointModerator}
          disabled={!moderatorMember || loadingModerator}
          className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-all"
        >
          {loadingModerator ? "Appointing..." : "Appoint Moderator"}
        </button>
      </div>

      {/* Transfer Manager */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#d9f2e0] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="3" stroke="#1fae70" strokeWidth="1.8" />
              <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 8H21M21 8L18.5 5.5M21 8L18.5 10.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#333]">Transfer Managership</p>
            <p className="text-xs text-[#999] mt-1">Select a member to transfer the manager role to. You will become a regular member after the transfer.</p>
          </div>
        </div>

        <select
          value={transferMember}
          onChange={(e) => setTransferMember(e.target.value)}
          className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors bg-white mb-4"
        >
          <option value="">Choose a member</option>
          {memberOptions.map((m: any) => (
            <option key={m.user_id} value={m.user_id}>{m.name || "Unknown"}</option>
          ))}
        </select>

        <button
          onClick={handleTransferManager}
          disabled={!transferMember || loadingTransfer}
          className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-all"
        >
          {loadingTransfer ? "Transferring..." : "Transfer Manager Role"}
        </button>
      </div>
    </div>
  );
}
