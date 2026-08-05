"use client";

import { useState } from "react";
import Link from "next/link";
import { popup } from "@/lib/popup";
import { ShareModal } from "./share-modal";

export function MessCodeClient({ messCode }: { messCode: string }) {
  const [code, setCode] = useState(messCode);
  const [regenerating, setRegenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      popup.success("Code copied to clipboard");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      popup.success("Code copied to clipboard");
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Are you sure? This will invalidate the current code.")) return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/mess/create", { method: "PUT" });
      const data = await res.json();
      if (res.ok && data.mess_code) {
        setCode(data.mess_code);
        popup.success("New code generated!");
      } else {
        popup.error(data.error || "Failed to regenerate");
      }
    } catch {
      popup.error("Failed to regenerate code");
    }
    setRegenerating(false);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center relative px-1 pt-4">
        <Link href="/dashboard/admin" className="absolute left-1 p-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-[17px] font-bold">Your Mess Code</span>
      </div>

      {/* Subtitle */}
      <p className="text-center text-[13.5px] text-[#6a4fd8] font-medium leading-relaxed px-6">
        Share this code with others<br />to join your mess
      </p>

      {/* Code Box */}
      <div className="border-2 border-dashed border-[#c9c0f2] rounded-[14px] bg-white py-4 text-center">
        <span className="text-[22px] font-bold tracking-wider">{code}</span>
      </div>

      {/* Copy / Share Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 bg-[#5b3fd6] text-white rounded-xl py-3.5 text-sm font-bold"
        >
          Copy Code
        </button>
        <button
          onClick={() => setShareOpen(true)}
          className="flex-1 bg-white text-[#5b3fd6] border-[1.6px] border-[#d9d3f7] rounded-xl py-3.5 text-sm font-bold"
        >
          Share Code
        </button>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-5 flex justify-center" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=${code}&color=1a1a1a&bgcolor=ffffff`}
          alt="QR Code"
          className="w-[190px] h-[190px]"
        />
      </div>

      {/* Regenerate */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="w-full bg-white text-[#5b3fd6] border-[1.6px] border-[#d9d3f7] rounded-[14px] py-3.5 text-[14.5px] font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 12C4 7.58 7.58 4 12 4C15 4 17.6 5.6 19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 12C20 16.42 16.42 20 12 20C9 20 6.4 18.4 5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 4V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 20V16H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {regenerating ? "Regenerating..." : "Regenerate Code"}
      </button>

      {/* Share Modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} messCode={code} />
    </div>
  );
}
