"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MonthWheelPicker } from "./month-wheel-picker";

interface MonthPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function MonthPickerField({ label, value, onChange }: MonthPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openSheet = () => {
    setDraft(value);
    setOpen(true);
  };

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="w-full flex items-center justify-between bg-[#f7f7fb] rounded-[14px] px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#6a4fd8] shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] font-semibold text-[#1e2130] truncate">
            {format(new Date(`${value}-01`), "MMMM yyyy")}
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#8b8fa3] shrink-0">
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setOpen(false)}>
          <style>{`@keyframes monthSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="relative bg-white w-full max-w-lg rounded-t-[24px] p-5 pb-7"
            style={{ animation: "monthSheetUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#ddd] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[17px] font-bold text-[#1e2130]">Set {label}</h3>
                <p className="text-[12px] text-[#8b8fa3]">Scroll or use arrow keys to pick</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f0f0f5] flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18M6 18L18 6" stroke="#666" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <MonthWheelPicker value={draft} onChange={setDraft} />

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setOpen(false)}
                className="text-[15px] font-semibold text-[#8b8fa3] px-4 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                className="px-9 py-2.5 rounded-full text-white text-[15px] font-bold"
                style={{
                  background: "linear-gradient(135deg, #7C6DE8, #6C5DD3)",
                  boxShadow: "0 6px 14px rgba(108,93,211,0.3)",
                }}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
