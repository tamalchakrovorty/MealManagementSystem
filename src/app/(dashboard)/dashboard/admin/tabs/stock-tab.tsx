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
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-3">{editingId ? "Edit Stock Item" : "Add Stock Item"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input placeholder="Item name" value={item} onChange={(e) => setItem(e.target.value)} required
              className="flex-1 border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" />
            <input type="number" step="0.01" min="0" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} required
              className="w-20 border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" />
            <input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}
              className="w-16 border border-[#e3e0f5] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#5b3fd6] text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-60">
              {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setItem(""); setQuantity(""); setUnit("kg"); setEditingId(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-[#e3e0f5] text-[#777]">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-3">Current Stock</h3>
        {stockItems.length > 0 ? (
          <div className="space-y-2">
            {stockItems.map((stock: any) => (
              <div key={stock.id} className="flex items-center justify-between py-2.5 border-b border-[#f0f0f5] last:border-0">
                <div>
                  <span className="text-sm font-semibold text-[#333]">{stock.item}</span>
                  <span className="text-sm text-[#999] ml-2">{Number(stock.quantity).toFixed(2)} {stock.unit}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(stock)} className="w-8 h-8 rounded-lg bg-[#f4f4fb] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#666" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#666" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button onClick={() => handleDelete(stock.id)} className="w-8 h-8 rounded-lg bg-[#fadada] flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#e5484d" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#999] text-center py-4">No stock items</p>
        )}
      </div>
    </div>
  );
}
