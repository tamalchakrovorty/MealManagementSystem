"use client";

import { useState } from "react";

interface DayData {
  date: string;
  rate: number;
}

export function MealRateGraph({ data, monthLabel, mealRate }: { data: DayData[]; monthLabel: string; mealRate: number }) {
  const [open, setOpen] = useState(false);

  const maxRate = Math.max(...data.map((d) => d.rate), 1);
  const avgRate = data.reduce((s, d) => s + d.rate, 0) / data.length;
  const chartHeight = 130;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-white rounded-[18px] p-4 shadow-[0_2px_8px_rgba(30,30,60,0.05)] text-left cursor-pointer hover:shadow-[0_4px_12px_rgba(30,30,60,0.1)] transition-shadow"
      >
        <div className="w-[38px] h-[38px] rounded-full bg-[#fff2df] flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#f2a03d" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[11px] text-[#8b8fa3] font-semibold mb-1">Meal Rate</p>
        <p className="text-[20px] font-extrabold text-[#1e2130]">
          ৳{mealRate.toFixed(2)}
        </p>
        <p className="text-[10px] text-[#8b8fa3] mt-1 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tap to view graph
        </p>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setOpen(false)}>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Sheet */}
          <div
            className="relative bg-white w-full max-w-lg rounded-t-[24px] p-5 pb-8"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#ddd] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[17px] font-bold text-[#1e2130]">Meal Rate Trend</h3>
                <p className="text-[12px] text-[#8b8fa3]">{monthLabel}</p>
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

                {/* Chart */}
                {data.length > 0 ? (
                  <div className="bg-[#fafafe] rounded-[16px] p-4 pt-5 pb-3">
                    {/* Bars */}
                    <div className="flex gap-1.5 items-end h-[160px]">
                      {data.map((d, i) => {
                        const barHeight = d.rate > 0 ? Math.max((d.rate / maxRate) * chartHeight, 3) : 0;
                        const dayNum = new Date(d.date).getDate();
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                            {/* Tooltip on hover */}
                            <div className="group relative w-full flex flex-col items-center">
                              <div className="absolute -top-8 bg-[#1e2130] text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                ৳{d.rate.toFixed(2)}
                              </div>
                              <div
                                className="w-full rounded-t-[4px] transition-all duration-300"
                                style={{
                                  height: `${barHeight}px`,
                                  background: d.rate > 0 ? "linear-gradient(180deg, #f2a03d, #e8940a)" : "#e8e6f0",
                                  opacity: d.rate > 0 ? 1 : 0.4,
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-[#8b8fa3] font-medium">{dayNum}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Avg rows */}
                    <div className="mt-3 pt-3 border-t border-[#eef0f4] flex items-center justify-between">
                      <span className="text-[11px] text-[#8b8fa3] font-semibold">Avg Daily Rate</span>
                      <span className="text-[13px] font-bold text-[#f2a03d]">৳{avgRate.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#8b8fa3] font-semibold">Month Meal Rate</span>
                      <span className="text-[13px] font-bold text-[#1e2130]">৳{mealRate.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
              <p className="text-sm text-[#8b8fa3] text-center py-10">No data for this month</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
