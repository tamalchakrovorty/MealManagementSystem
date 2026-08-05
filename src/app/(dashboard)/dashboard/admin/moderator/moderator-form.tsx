"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";

export function ModeratorForm({
  members, messId, isManager,
}: {
  members: any[]; messId: string; isManager: boolean;
}) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);

  const memberOptions = members.filter((m: any) => m.role !== "manager");

  const handleAppoint = async () => {
    if (!selectedMember || !isManager) return;
    setLoading(true);
    const res = await fetch("/api/admin/members", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mess_id: messId, userId: selectedMember, role: "moderator" }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Moderator appointed");
      setSelectedMember("");
      router.refresh();
    }
    setLoading(false);
  };

  if (!isManager) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <p className="text-sm text-[#999]">Only the manager can appoint a moderator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="flex items-start gap-3">
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
      </div>

      {/* Select Member */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <label className="block text-xs font-semibold text-[#666] mb-2">Select Member</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors bg-white mb-4"
        >
          <option value="">Choose a member</option>
          {memberOptions.map((m: any) => (
            <option key={m.user_id} value={m.user_id}>{m.name || "Unknown"}</option>
          ))}
        </select>

        <button
          onClick={handleAppoint}
          disabled={!selectedMember || loading}
          className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-all"
        >
          {loading ? "Appointing..." : "Appoint Moderator"}
        </button>
      </div>
    </div>
  );
}
