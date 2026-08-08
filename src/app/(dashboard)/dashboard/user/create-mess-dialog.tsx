"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { popup } from "@/lib/popup";

export function CreateMessDialog({ defaultOpen }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/mess/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    popup.success(`Mess "${data.mess.name}" created! Code: ${data.mess.mess_code}`);
    setOpen(false);
    setName("");
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-[15.5px] font-bold flex items-center justify-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Create Mess
          </button>
        }
      />
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-3">
          <button onClick={() => setOpen(false)} className="text-foreground">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-lg font-bold">Create Mess</span>
        </div>

        {/* Illustration */}
        <div className="px-5 mb-5">
          <div className="bg-card rounded-2xl p-2.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full block">
              <ellipse cx="160" cy="165" rx="140" ry="14" fill="#e3e6f0" />
              <polygon points="160,20 235,65 85,65" fill="#3f5478" />
              <rect x="95" y="65" width="130" height="85" fill="#e2e6ef" />
              <rect x="160" y="42" width="16" height="16" fill="#7fa8d8" />
              <rect x="140" y="100" width="34" height="50" fill="#6b4527" />
              <circle cx="168" cy="126" r="2" fill="#f0c060" />
              <rect x="185" y="90" width="26" height="26" fill="#f2f5fa" stroke="#3f5478" strokeWidth="2" />
              <line x1="198" y1="90" x2="198" y2="116" stroke="#3f5478" strokeWidth="2" />
              <line x1="185" y1="103" x2="211" y2="103" stroke="#3f5478" strokeWidth="2" />
              <polygon points="150,150 164,150 178,178 136,178" fill="#e8c98a" />
              <ellipse cx="160" cy="172" rx="120" ry="10" fill="#8fc37a" />
              <circle cx="75" cy="130" r="18" fill="#5a9b5c" />
              <circle cx="60" cy="145" r="14" fill="#4a8a4c" />
              <circle cx="250" cy="130" r="18" fill="#5a9b5c" />
              <circle cx="265" cy="145" r="14" fill="#4a8a4c" />
              <circle cx="90" cy="155" r="10" fill="#e0812c" />
              <circle cx="235" cy="155" r="10" fill="#e0812c" />
              <circle cx="192" cy="128" r="12" fill="#c98a5c" />
              <path d="M180 126C180 118 185 112 192 112C199 112 204 118 204 126" fill="#1a1410" />
              <rect x="176" y="136" width="32" height="26" rx="8" fill="#e0812c" />
              <rect x="170" y="150" width="44" height="16" rx="6" fill="#3a4f8f" />
            </svg>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="px-5 pb-5 space-y-4">
          {/* Mess Name */}
          <div>
            <label className="text-[13.5px] font-bold block mb-2">Mess Name</label>
            <input
              type="text"
              placeholder="e.g. Green House Mess"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-card border-[1.4px] border-border rounded-[14px] px-4 py-3.5 text-[14.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[13.5px] font-bold block mb-2">Address (optional)</label>
            <input
              type="text"
              placeholder="e.g. Dhanmondi, Dhaka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-card border-[1.4px] border-border rounded-[14px] px-4 py-3.5 text-[14.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && <p className="text-sm text-[#e5484d]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-[14px] py-4 text-[15.5px] font-bold disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
