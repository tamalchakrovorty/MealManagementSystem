"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { popup } from "@/lib/popup";

export function BazarTab({ messId, members }: { messId: string; members: any[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { popup.error("Select who did the bazar"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/bazar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mess_id: messId, user_id: userId, amount: Number(amount), date, notes: notes || null }),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success("Bazar expense recorded"); setAmount(""); setNotes(""); router.refresh(); }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
      <h3 className="text-[15px] font-bold mb-4">Input Bazar / Shopping Expense</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#666] mb-1.5">Who did the bazar?</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}
            className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors bg-white">
            <option value="">Select member</option>
            {members.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.name || "Unknown"}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[#666] mb-1.5">Amount (৳)</label>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" required />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[#666] mb-1.5">Date</label>
            <DatePickerField value={date} onChange={setDate} className="w-full" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666] mb-1.5">Notes (optional)</label>
          <textarea placeholder="What was bought?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors resize-none" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
          {loading ? "Saving..." : "Save Expense"}
        </button>
      </form>
    </div>
  );
}
