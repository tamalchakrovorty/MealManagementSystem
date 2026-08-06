"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { popup } from "@/lib/popup";

const CATEGORIES = [
  "Manager",
  "Owner",
  "Electrician",
  "Plumber",
  "Internet Provider",
  "Gas",
  "Water",
  "Emergency",
  "Hospital",
  "Police",
  "Fire Service",
  "Custom",
];

export function ContactsTab({ messId, contacts }: { messId: string; contacts: Record<string, string>[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"add" | "list">("add");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Manager");
  const [customCategory, setCustomCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveCategory = category === "Custom" ? customCategory : category;

  const resetForm = () => {
    setName("");
    setCategory("Manager");
    setCustomCategory("");
    setPhone("");
    setDescription("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCategory.trim()) {
      popup.error("Category is required");
      return;
    }
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const body = editingId
      ? { id: editingId, name, category: effectiveCategory, phone, description }
      : { mess_id: messId, name, category: effectiveCategory, phone, description };
    const res = await fetch("/api/admin/contacts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success(editingId ? "Contact updated" : "Contact added");
      resetForm();
      router.refresh();
    }
    setLoading(false);
  };

  const handleEdit = (contact: Record<string, string>) => {
    setName(contact.name);
    setPhone(contact.phone);
    setDescription(contact.description || "");
    setEditingId(contact.id);
    if (CATEGORIES.includes(contact.category)) {
      setCategory(contact.category);
      setCustomCategory("");
    } else {
      setCategory("Custom");
      setCustomCategory(contact.category);
    }
    setTab("add");
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const d = await res.json();
      popup.error(d.error);
    } else {
      popup.success("Contact removed");
      router.refresh();
    }
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Manager: "bg-[#ece9fb] text-[#6a4fd8]",
      Owner: "bg-[#dbeafe] text-[#2563eb]",
      Electrician: "bg-[#fef3c7] text-[#d97706]",
      Plumber: "bg-[#d1fae5] text-[#059669]",
      "Internet Provider": "bg-[#e0e7ff] text-[#4f46e5]",
      Gas: "bg-[#fce7f3] text-[#db2777]",
      Water: "bg-[#cffafe] text-[#0891b2]",
      Emergency: "bg-[#fee2e2] text-[#dc2626]",
      Hospital: "bg-[#fce7f3] text-[#db2777]",
      Police: "bg-[#dbeafe] text-[#1d4ed8]",
      "Fire Service": "bg-[#fee2e2] text-[#dc2626]",
    };
    return colors[cat] || "bg-[#f0f0f5] text-[#666]";
  };

  const FormCard = () => (
    <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <h3 className="text-[15px] md:text-[17px] font-bold mb-3 md:mb-4">{editingId ? "Edit Contact" : "Add Contact"}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 border border-[#e3e0f5] rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-[#6a4fd8] transition-colors"
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-36 border border-[#e3e0f5] rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-[#6a4fd8] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 border border-[#e3e0f5] rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-[#6a4fd8] transition-colors bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {category === "Custom" && (
            <input
              placeholder="Custom category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              required
              className="flex-1 border border-[#e3e0f5] rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-[#6a4fd8] transition-colors"
            />
          )}
        </div>
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-[#e3e0f5] rounded-xl px-3 py-2.5 md:py-3 text-sm outline-none focus:border-[#6a4fd8] transition-colors"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#5b3fd6] text-white rounded-xl py-2.5 md:py-3 text-sm font-bold disabled:opacity-60 transition-colors hover:bg-[#4a32c0]"
          >
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 md:py-3 rounded-xl text-sm font-bold border border-[#e3e0f5] text-[#777] hover:bg-[#f4f4fb] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  const ListCard = () => (
    <div className="bg-white rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#ECEEF5] transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <h3 className="text-[15px] md:text-[17px] font-bold mb-3 md:mb-4">All Contacts</h3>
      {contacts.length > 0 ? (
        <div className="space-y-2">
          {contacts.map((contact: Record<string, string>) => (
            <div key={contact.id} className="py-3 border-b border-[#f0f0f5] last:border-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm md:text-[15px] font-semibold text-[#333] truncate">{contact.name}</span>
                  <span className={`text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${categoryColor(contact.category)}`}>
                    {contact.category}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="w-8 h-8 rounded-lg bg-[#f4f4fb] flex items-center justify-center hover:bg-[#ece9fe] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#666" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#666" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="w-8 h-8 rounded-lg bg-[#fadada] flex items-center justify-center hover:bg-[#f8d0d0] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#e5484d" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-[13px] text-[#999]">
                <a href={`tel:${contact.phone}`} className="font-semibold text-[#6a4fd8] hover:underline">{contact.phone}</a>
                {contact.description && <span className="text-[#bbb]">|</span>}
                {contact.description && <span className="truncate">{contact.description}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-[#f4f4fb] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="#8b8fa3" strokeWidth="2" />
              <path d="M9 10H15M9 14H13" stroke="#8b8fa3" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[14px] text-[#8b8fa3]">No contacts added yet</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Tab toggle */}
      <div className="md:hidden">
        <div className="bg-[#f4f4fb] rounded-[14px] p-1.5 flex gap-1 mb-4">
          <button
            type="button"
            onClick={() => setTab("add")}
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
              tab === "add" ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
            }`}
          >
            Add Contact
          </button>
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all ${
              tab === "list" ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
            }`}
          >
            All Contacts
          </button>
        </div>
        {tab === "add" ? <FormCard /> : <ListCard />}
      </div>

      {/* Desktop: Side by side */}
      <div className="hidden md:grid md:grid-cols-[1fr_1.5fr] md:gap-5">
        <FormCard />
        <ListCard />
      </div>
    </>
  );
}
