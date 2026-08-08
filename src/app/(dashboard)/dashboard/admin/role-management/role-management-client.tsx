"use client";

import { useState, useEffect, useRef } from "react";
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
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [moderatorOpen, setModeratorOpen] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const moderatorRef = useRef<HTMLDivElement>(null);
  const transferRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!moderatorOpen) return;
    const handler = (e: PointerEvent) => {
      if (moderatorRef.current && !moderatorRef.current.contains(e.target as Node)) setModeratorOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [moderatorOpen]);

  useEffect(() => {
    if (!transferOpen) return;
    const handler = (e: PointerEvent) => {
      if (transferRef.current && !transferRef.current.contains(e.target as Node)) setTransferOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [transferOpen]);

  const memberOptions = members.filter((m: any) => m.role !== "manager");
  
  const selectedModeratorMember = memberOptions.find((m: any) => m.user_id === moderatorMember);
  const filteredModeratorMembers = memberOptions.filter((m: any) =>
    (m.name || "Unknown").toLowerCase().includes(moderatorSearch.toLowerCase())
  );

  const selectedTransferMember = memberOptions.find((m: any) => m.user_id === transferMember);
  const filteredTransferMembers = memberOptions.filter((m: any) =>
    (m.name || "Unknown").toLowerCase().includes(transferSearch.toLowerCase())
  );

  if (!mounted) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="bg-card rounded-[18px] p-8 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
          <p className="text-sm md:text-base text-muted-foreground">Loading...</p>
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
      <div className="bg-card rounded-[18px] p-8 md:p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
        <p className="text-sm md:text-base text-muted-foreground">Only the manager can manage roles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Appoint Moderator */}
      <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
        <div className="flex items-start gap-3 mb-4 md:mb-5">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#fbe4cf] flex items-center justify-center shrink-0 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="md:w-[22px] md:h-[22px]">
              <circle cx="9" cy="8" r="3" stroke="#d98a1c" strokeWidth="1.8" />
              <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#d98a1c" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 10L17 12L21 8" stroke="#d98a1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm md:text-base font-semibold text-foreground">Appoint Moderator</p>
            <p className="text-xs md:text-[13px] text-muted-foreground mt-1">Select a member to appoint as moderator. Moderators can help manage the mess.</p>
          </div>
        </div>

        {/* Searchable Dropdown for Moderator */}
        <div ref={moderatorRef} className="relative mb-4">
          <button type="button" onClick={() => { setModeratorOpen(!moderatorOpen); setModeratorSearch(""); }}
            className="w-full border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm text-left outline-none focus:border-primary transition-colors bg-card flex items-center justify-between">
            <span className={selectedModeratorMember ? "text-foreground" : "text-muted-foreground"}>{selectedModeratorMember ? selectedModeratorMember.name : "Choose a member"}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted-foreground"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {moderatorOpen && (
            <div className="absolute z-50 mt-1 w-full bg-card rounded-xl border border-input shadow-lg max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-card px-3 py-2 border-b border-border">
                <input
                  type="text"
                  value={moderatorSearch}
                  onChange={(e) => setModeratorSearch(e.target.value)}
                  placeholder="Search member..."
                  autoFocus
                  className="w-full text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {filteredModeratorMembers.length > 0 ? (
                filteredModeratorMembers.map((m: any) => (
                  <button key={m.user_id} type="button"
                    onClick={() => { setModeratorMember(m.user_id); setModeratorOpen(false); setModeratorSearch(""); }}
                    className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${moderatorMember === m.user_id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}>
                    {m.name || "Unknown"}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 text-sm text-muted-foreground">No members found</div>
              )}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-muted-foreground mb-1.5">From</label>
            <DatePickerField value={moderatorFrom} onChange={setModeratorFrom} className="w-full" />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-muted-foreground mb-1.5">Until</label>
            <DatePickerField value={moderatorUntil} onChange={setModeratorUntil} min={moderatorFrom} className="w-full" />
          </div>
        </div>

        <button
          onClick={handleAppointModerator}
          disabled={!moderatorMember || loadingModerator}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 md:py-3.5 text-sm md:text-[15px] font-bold disabled:opacity-60 transition-all hover:bg-primary"
        >
          {loadingModerator ? "Appointing..." : "Appoint Moderator"}
        </button>
      </div>

      {/* Transfer Manager */}
      <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
        <div className="flex items-start gap-3 mb-4 md:mb-5">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#d9f2e0] flex items-center justify-center shrink-0 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="md:w-[22px] md:h-[22px]">
              <circle cx="9" cy="8" r="3" stroke="#1fae70" strokeWidth="1.8" />
              <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 8H21M21 8L18.5 5.5M21 8L18.5 10.5" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm md:text-base font-semibold text-foreground">Transfer Managership</p>
            <p className="text-xs md:text-[13px] text-muted-foreground mt-1">Select a member to transfer the manager role to. You will become a regular member after the transfer.</p>
          </div>
        </div>

        {/* Searchable Dropdown for Transfer */}
        <div ref={transferRef} className="relative mb-4">
          <button type="button" onClick={() => { setTransferOpen(!transferOpen); setTransferSearch(""); }}
            className="w-full border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm text-left outline-none focus:border-primary transition-colors bg-card flex items-center justify-between">
            <span className={selectedTransferMember ? "text-foreground" : "text-muted-foreground"}>{selectedTransferMember ? selectedTransferMember.name : "Choose a member"}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-muted-foreground"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {transferOpen && (
            <div className="absolute z-50 mt-1 w-full bg-card rounded-xl border border-input shadow-lg max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-card px-3 py-2 border-b border-border">
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  placeholder="Search member..."
                  autoFocus
                  className="w-full text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {filteredTransferMembers.length > 0 ? (
                filteredTransferMembers.map((m: any) => (
                  <button key={m.user_id} type="button"
                    onClick={() => { setTransferMember(m.user_id); setTransferOpen(false); setTransferSearch(""); }}
                    className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${transferMember === m.user_id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}>
                    {m.name || "Unknown"}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 text-sm text-muted-foreground">No members found</div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleTransferManager}
          disabled={!transferMember || loadingTransfer}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 md:py-3.5 text-sm md:text-[15px] font-bold disabled:opacity-60 transition-all hover:bg-primary"
        >
          {loadingTransfer ? "Transferring..." : "Transfer Manager Role"}
        </button>
      </div>
    </div>
  );
}
