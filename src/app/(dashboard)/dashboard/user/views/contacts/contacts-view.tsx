"use client";

import { useState } from "react";
import { popup } from "@/lib/popup";

interface Contact {
  id: string;
  name: string;
  category: string;
  phone: string;
  description: string | null;
}

export function ContactsView({ contacts }: { contacts: Contact[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (phone: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(phone);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = phone;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      popup.success("Number copied!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      popup.error("Failed to copy");
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

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      Manager: "👤",
      Owner: "🏠",
      Electrician: "⚡",
      Plumber: "🔧",
      "Internet Provider": "🌐",
      Gas: "🔥",
      Water: "💧",
      Emergency: "🚨",
      Hospital: "🏥",
      Police: "🚔",
      "Fire Service": "🧯",
    };
    return icons[cat] || "📞";
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="w-16 h-16 rounded-full bg-[#f0f0f5] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="2" width="14" height="20" rx="2" stroke="#999" strokeWidth="1.8" />
            <path d="M9 10H15M9 14H13" stroke="#999" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[15px] font-semibold text-[#333] mb-1">No contacts yet</p>
        <p className="text-sm text-[#999]">Important contacts will appear here once added by the admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-white rounded-2xl p-4"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{categoryIcon(contact.category)}</span>
              <div>
                <span className="text-[15px] font-bold text-[#333] block">{contact.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColor(contact.category)}`}>
                  {contact.category}
                </span>
              </div>
            </div>
          </div>

          {contact.description && (
            <p className="text-[13px] text-[#666] mb-3 ml-9">{contact.description}</p>
          )}

          <div className="flex items-center gap-2 ml-9">
            <a
              href={`tel:${contact.phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1fae70] text-white rounded-xl py-2.5 text-sm font-bold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Call
            </a>
            <button
              onClick={() => handleCopy(contact.phone, contact.id)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold border transition-colors ${
                copiedId === contact.id
                  ? "bg-[#d6f3e4] border-[#1fae70] text-[#1fae70]"
                  : "bg-[#f4f4fb] border-[#e3e0f5] text-[#666]"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {copiedId === contact.id ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
