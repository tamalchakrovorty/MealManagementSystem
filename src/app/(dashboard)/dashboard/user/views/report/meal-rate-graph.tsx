"use client";

import { useState } from "react";

interface DayData {
  date: string;
  rate: number;
}

export function MealRateGraph({ data, monthLabel, mealRate }: { data: DayData[]; monthLabel: string; mealRate: number }) {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxRate = Math.max(...data.map((d) => d.rate), 1);
  const avgRate = data.reduce((s, d) => s + d.rate, 0) / data.length;

  const getX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
  const getY = (rate: number) => padding.top + plotHeight - (rate / maxRate) * plotHeight;

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.rate)}`).join(" ");
  const areaPoints = `${getX(0)},${padding.top + plotHeight} ${linePoints} ${getX(data.length - 1)},${padding.top + plotHeight}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(30,30,60,0.05)] text-left cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_4px_12px_rgba(30,30,60,0.1)] transition-all duration-300"
      >
        <div className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#fff2df] flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 20L8 14L12 16L16 10L21 4" stroke="#f2a03d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 4H21V10" stroke="#f2a03d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[11px] md:text-[13px] text-muted-foreground font-semibold mb-1">Meal Rate</p>
        <p className="text-[20px] md:text-[24px] font-extrabold text-foreground">
          ৳{mealRate.toFixed(2)}
        </p>
        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tap to view graph
        </p>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={() => setOpen(false)}>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
          <div className="absolute inset-0 bg-black/40" />

          <div
            className="relative bg-card w-full max-w-lg md:max-w-2xl rounded-t-[24px] md:rounded-[24px] p-5 pb-8 md:p-6"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[17px] md:text-[19px] font-bold text-foreground">Meal Rate Trend</h3>
                <p className="text-[12px] md:text-[13px] text-muted-foreground">{monthLabel}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {data.length > 0 ? (
              <div className="bg-[#fafafe] rounded-[16px] p-4 md:p-5 pt-5 md:pt-6 pb-3">
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-auto"
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setHoveredIndex(null)}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f2a03d" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f2a03d" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f2a03d" />
                        <stop offset="100%" stopColor="#e8940a" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <polygon points={areaPoints} fill="url(#areaGradient)" />

                    {/* Line */}
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points + hover zones */}
                    {data.map((d, i) => {
                      const x = getX(i);
                      const y = getY(d.rate);
                      const isHovered = hoveredIndex === i;
                      return (
                        <g key={i}>
                          {/* Hover zone */}
                           <rect
                            x={x - plotWidth / data.length / 2}
                            y={padding.top}
                            width={plotWidth / data.length}
                            height={plotHeight}
                            fill="transparent"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onTouchEnd={(e) => { e.preventDefault(); setHoveredIndex(i); }}
                          />
                          {/* Dot */}
                          {d.rate > 0 && (
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 5 : 3}
                              fill="#f2a03d"
                              stroke="white"
                              strokeWidth="2"
                              style={{ transition: "r 0.15s ease" }}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Tooltip */}
                    {hoveredIndex !== null && (
                      <g>
                        <rect
                          x={getX(hoveredIndex) - 40}
                          y={getY(data[hoveredIndex].rate) - 32}
                          width="80"
                          height="22"
                          rx="6"
                          fill="#1e2130"
                        />
                        <text
                          x={getX(hoveredIndex)}
                          y={getY(data[hoveredIndex].rate) - 17}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          ৳{data[hoveredIndex].rate.toFixed(2)}
                        </text>
                        {/* Vertical guide line */}
                        <line
                          x1={getX(hoveredIndex)}
                          y1={padding.top}
                          x2={getX(hoveredIndex)}
                          y2={padding.top + plotHeight}
                          stroke="#1e2130"
                          strokeWidth="1"
                          strokeDasharray="4,3"
                          opacity="0.3"
                        />
                      </g>
                    )}
                  </svg>
                </div>

                {/* X-axis labels: show every 5th day + last day */}
                <div className="flex justify-between px-1 mt-1">
                  {data.map((d, i) => {
                    const dayNum = new Date(d.date).getDate();
                    const show = dayNum === 1 || dayNum % 5 === 0 || i === data.length - 1;
                    if (!show) return <span key={i} className="text-[8px] md:text-[10px] text-transparent">{dayNum}</span>;
                    return (
                      <span key={i} className="text-[8px] md:text-[10px] text-muted-foreground font-medium">{dayNum}</span>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] md:text-[13px] text-muted-foreground font-semibold">Avg Daily Rate</span>
                  <span className="text-[13px] md:text-[15px] font-bold text-[#f2a03d]">৳{avgRate.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] md:text-[13px] text-muted-foreground font-semibold">Month Meal Rate</span>
                  <span className="text-[13px] md:text-[15px] font-bold text-foreground">৳{mealRate.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data for this month</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
