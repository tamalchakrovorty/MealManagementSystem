"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { popup } from "@/lib/popup";

export function DepositsTab({ messId, members }: { messId: string; members: any[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const memberRef = useRef<HTMLDivElement>(null);

  // Initialize date on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!date) {
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [date]);

  const selectedMember = members.find((m: any) => m.user_id === userId);
  const filteredMembers = members.filter((m: any) =>
    (m.name || "Unknown").toLowerCase().includes(memberSearch.toLowerCase())
  );

  useEffect(() => {
    if (!memberOpen) return;
    const handler = (e: PointerEvent) => {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) setMemberOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [memberOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { popup.error("Select a member"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mess_id: messId, user_id: userId, amount: Number(amount), date }),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success("Deposit recorded"); setAmount(""); router.refresh(); }
    setLoading(false);
  };

  return (
    <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <h3 className="text-[15px] md:text-[17px] font-bold mb-4">Input Deposit</h3>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Member</label>
          <div ref={memberRef} className="relative">
            <button type="button" onClick={() => { setMemberOpen(!memberOpen); setMemberSearch(""); }}
              className="w-full border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm text-left outline-none focus:border-primary transition-colors bg-card flex items-center justify-between">
              <span className={selectedMember ? "text-foreground" : "text-[#aaa]"}>{selectedMember ? selectedMember.name : "Select member"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="#8b8fa3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {memberOpen && (
              <div className="absolute z-50 mt-1 w-full bg-card rounded-xl border border-border shadow-lg max-h-48 overflow-y-auto">
                <div className="sticky top-0 bg-card px-3 py-2 border-b border-border">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search member..."
                    autoFocus
                    className="w-full text-sm outline-none text-foreground placeholder:text-[#aaa]"
                  />
                </div>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((m: any) => (
                    <button key={m.user_id} type="button"
                      onClick={() => { setUserId(m.user_id); setMemberOpen(false); setMemberSearch(""); }}
                      className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${userId === m.user_id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"}`}>
                      {m.name || "Unknown"}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2.5 text-sm text-[#aaa]">No members found</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Amount (৳)</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-primary transition-colors" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date</label>
          <DatePickerField value={date} onChange={setDate} className="w-full" />
        </div>
        <button type="submit" disabled={loading}
          className="md:col-span-2 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-opacity">
          {loading ? "Saving..." : "Save Deposit"}
        </button>
      </form>
    </div>
  );
}
