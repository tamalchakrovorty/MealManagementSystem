"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";

export function StockTab({ messId, stockItems }: { messId: string; stockItems: any[] }) {
  const router = useRouter();
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const body = editingId
      ? { id: editingId, item, quantity: Number(quantity), unit }
      : { mess_id: messId, item, quantity: Number(quantity), unit };
    const res = await fetch("/api/admin/stock", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success(editingId ? "Stock updated" : "Stock item added"); }
    setItem(""); setQuantity(""); setUnit("kg"); setEditingId(null);
    setLoading(false); router.refresh();
  };

  const handleEdit = (stock: any) => {
    setItem(stock.item); setQuantity(String(stock.quantity)); setUnit(stock.unit || "kg"); setEditingId(stock.id);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/admin/stock", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success("Stock item removed"); router.refresh(); }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Add/Edit Form */}
      <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300">
        <h3 className="text-[15px] md:text-[17px] font-bold mb-4">{editingId ? "Edit Stock Item" : "Add Stock Item"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input placeholder="Item name" value={item} onChange={(e) => setItem(e.target.value)} required
              className="flex-1 border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-primary transition-colors" />
            <input type="number" step="0.01" min="0" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required
              className="w-full sm:w-28 border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-primary transition-colors" />
            <input placeholder="Unit (kg, pcs)" value={unit} onChange={(e) => setUnit(e.target.value)}
              className="w-full sm:w-24 border border-input rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 md:py-3 text-sm font-bold disabled:opacity-60 transition-opacity">
              {loading ? "..." : editingId ? "Update Item" : "Add Item"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setItem(""); setQuantity(""); setUnit("kg"); setEditingId(null); }}
                className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-sm font-bold border border-border text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stock List */}
      <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300">
        <h3 className="text-[15px] md:text-[17px] font-bold mb-4">Current Stock</h3>
        {stockItems.length > 0 ? (
          <div className="space-y-0">
            {stockItems.map((stock: any) => (
              <div key={stock.id} className="flex items-center justify-between py-3 md:py-4 border-b border-border last:border-0 hover:bg-muted transition-colors -mx-4 md:-mx-5 px-4 md:px-5">
                <div className="flex-1">
                  <span className="text-sm md:text-base font-semibold text-foreground block">{stock.item}</span>
                  <span className="text-xs md:text-sm text-muted-foreground mt-0.5 block">{Number(stock.quantity).toFixed(2)} {stock.unit}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(stock)} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button onClick={() => handleDelete(stock.id)} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#fadada] flex items-center justify-center hover:bg-[#f5c5c5] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#e5484d" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm md:text-base text-muted-foreground text-center py-8 md:py-12">No stock items yet</p>
        )}
      </div>
    </div>
  );
}
