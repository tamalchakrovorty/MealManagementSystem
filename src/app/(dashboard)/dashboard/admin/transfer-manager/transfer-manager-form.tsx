"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";

export function TransferManagerForm({
  members, messId, currentUserId, isManager,
}: {
  members: any[]; messId: string; currentUserId: string; isManager: boolean;
}) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);

  const memberOptions = members.filter((m: any) => m.role !== "manager");

  const handleTransfer = async () => {
    if (!selectedMember || !isManager) return;
    setLoading(true);
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mess_id: messId, userId: selectedMember, action: "transfer_manager" }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Managership transferred!");
      router.refresh();
    }
    setLoading(false);
  };

  if (!isManager) {
    return (
      <div className="bg-card rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <p className="text-sm text-muted-foreground">Only the manager can transfer managership.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d9f2e0] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="8" r="3" stroke="#1fae70" strokeWidth="1.8" />
              <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 8H21M21 8L18.5 5.5M21 8L18.5 10.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Transfer Managership</p>
            <p className="text-xs text-muted-foreground mt-1">Select a member to transfer the manager role to. You will become a regular member after the transfer.</p>
          </div>
        </div>
      </div>

      {/* Select Member */}
      <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">Select Member</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="w-full border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-card mb-4"
        >
          <option value="">Choose a member</option>
          {memberOptions.map((m: any) => (
            <option key={m.user_id} value={m.user_id}>{m.name || "Unknown"}</option>
          ))}
        </select>

        <button
          onClick={handleTransfer}
          disabled={!selectedMember || loading}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-all"
        >
          {loading ? "Transferring..." : "Transfer Manager Role"}
        </button>
      </div>
    </div>
  );
}
