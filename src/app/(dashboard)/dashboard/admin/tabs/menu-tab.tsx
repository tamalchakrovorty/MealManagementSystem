"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { popup } from "@/lib/popup";

export function MenuTab({ messId, menus }: { messId: string; menus: any[] }) {
  const router = useRouter();
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [breakfast, setBreakfast] = useState("");
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const body = editingId
      ? { id: editingId, breakfast, lunch, dinner }
      : { mess_id: messId, date, breakfast, lunch, dinner };
    const res = await fetch("/api/admin/menu", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success(editingId ? "Menu updated" : "Menu saved"); }
    setBreakfast(""); setLunch(""); setDinner(""); setEditingId(null);
    setLoading(false); router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-3">{editingId ? "Edit Menu" : "Update Menu"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date</label>
            <DatePickerField value={date} onChange={setDate} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Breakfast</label>
            <input placeholder="What's for breakfast?" value={breakfast} onChange={(e) => setBreakfast(e.target.value)}
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Lunch</label>
            <input placeholder="What's for lunch?" value={lunch} onChange={(e) => setLunch(e.target.value)}
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Dinner</label>
            <input placeholder="What's for dinner?" value={dinner} onChange={(e) => setDinner(e.target.value)}
              className="w-full border border-input rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-60">
              {editingId ? "Update" : "Save Menu"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setBreakfast(""); setLunch(""); setDinner(""); setEditingId(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-border text-muted-foreground">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-3">Menu Calendar</h3>
        {menus.length > 0 ? (
          <div className="space-y-2">
            {menus.map((menu: any) => (
              <div key={menu.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">{format(new Date(menu.date), "d MMM, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">B: {menu.breakfast || "-"} · L: {menu.lunch || "-"} · D: {menu.dinner || "-"}</p>
                </div>
                <button onClick={() => { setDate(menu.date); setBreakfast(menu.breakfast || ""); setLunch(menu.lunch || ""); setDinner(menu.dinner || ""); setEditingId(menu.id); }}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#666" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#666" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No menus set</p>
        )}
      </div>
    </div>
  );
}
