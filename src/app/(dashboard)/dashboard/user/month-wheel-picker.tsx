"use client";

import { useEffect, useRef, useCallback } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ITEM_HEIGHT = 44;
const PAD_HEIGHT = 88;
const SETTLE_DELAY = 200;

const itemClass = (dist: number) =>
  `h-[44px] flex items-center justify-center transition-all duration-150 ${
    dist === 0
      ? "text-[23px] font-bold text-primary"
      : dist === 1
        ? "text-[21px] text-muted-foreground opacity-[0.65]"
        : "text-[21px] text-[#c9c9d4] opacity-[0.4]"
  }`;

interface WheelColProps {
  items: string[];
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
}

function WheelCol({ items, index, onIndexChange, label }: WheelColProps) {
  const colRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initialIndex = useRef(index).current;
  const committed = useRef(index);
  const displayed = useRef(index);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = items.length;
  const onIndexChangeRef = useRef(onIndexChange);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const applyDisplay = useCallback((el: HTMLDivElement, i: number) => {
    el.querySelectorAll("[role=option]").forEach((child, idx) => {
      if (idx >= count) return;
      child.className = itemClass(Math.abs(idx - i));
      child.setAttribute("aria-selected", String(idx === i));
    });
  }, [count]);

  const settle = useCallback(() => {
    if (!colRef.current) return;
    const i = Math.round(colRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(count - 1, i));
    colRef.current.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    if (clamped !== committed.current) {
      committed.current = clamped;
      onIndexChangeRef.current(clamped);
    }
  }, [count]);

  useEffect(() => {
    if (colRef.current) {
      colRef.current.scrollTop = initialIndex * ITEM_HEIGHT;
    }
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = colRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0;
      if (dir === 0) return;

      const target = Math.max(0, Math.min(count - 1, displayed.current + dir));
      if (target !== displayed.current) {
        el.scrollTop = target * ITEM_HEIGHT;
        displayed.current = target;
        applyDisplay(el, target);
      }

      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(settle, SETTLE_DELAY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [count, applyDisplay, settle]);

  const moveTo = (i: number) => {
    const target = Math.max(0, Math.min(count - 1, i));
    colRef.current?.scrollTo({ top: target * ITEM_HEIGHT, behavior: "smooth" });
    displayed.current = target;
    applyDisplay(colRef.current!, target);
    if (target !== committed.current) {
      committed.current = target;
      onIndexChangeRef.current(target);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveTo(displayed.current + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveTo(displayed.current - 1);
    }
  };

  return (
    <div
      ref={colRef}
      onScroll={() => {
        if (!colRef.current) return;
        const i = Math.round(colRef.current.scrollTop / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(count - 1, i));
        if (clamped !== displayed.current) {
          displayed.current = clamped;
          applyDisplay(colRef.current, clamped);
        }
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label={label}
      className="relative w-[100px] h-[220px] overflow-y-scroll cursor-grab active:cursor-grabbing select-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`.wheel-col::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ height: PAD_HEIGHT, flexShrink: 0 }} />
      {items.map((item, i) => (
        <div
          key={item}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className={itemClass(Math.abs(i - index))}
          style={{ height: ITEM_HEIGHT, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          role="option"
          aria-selected={i === index}
        >
          {item}
        </div>
      ))}
      <div style={{ height: PAD_HEIGHT, flexShrink: 0 }} />
    </div>
  );
}

interface MonthWheelPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function MonthWheelPicker({ value, onChange }: MonthWheelPickerProps) {
  const [yearStr, monthStr] = value.split("-");
  const years = Array.from({ length: 2036 - 2000 + 1 }, (_, i) => String(2000 + i));
  const yearIndex = Math.max(0, years.indexOf(yearStr));
  const monthIndex = Math.max(0, parseInt(monthStr, 10) - 1);

  const emit = (y: number, m: number) => {
    onChange(`${years[y]}-${String(m + 1).padStart(2, "0")}`);
  };

  return (
    <div>
      <div
        className="relative flex justify-center gap-8 h-[220px] rounded-[16px] bg-muted overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 28%, #000 72%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 28%, #000 72%, transparent 100%)",
        }}
      >
        <div className="absolute top-1/2 left-3 right-3 h-[44px] -translate-y-1/2 border-t border-b border-border pointer-events-none" />
        <WheelCol items={MONTHS} index={monthIndex} onIndexChange={(m) => emit(yearIndex, m)} label="Month" />
        <WheelCol items={years} index={yearIndex} onIndexChange={(y) => emit(y, monthIndex)} label="Year" />
      </div>
      <p className="text-center text-[11px] text-muted-foreground mt-2">Use arrow keys on desktop</p>
    </div>
  );
}
