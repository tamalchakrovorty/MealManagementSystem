"use client";

import { useState } from "react";
import { DepositsTab } from "../tabs/deposits-tab";
import { DepositHistory } from "../tabs/deposit-history";

export function DepositsPageClient({ messId, members, deposits }: { messId: string; members: any[]; deposits: any[] }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-4 md:space-y-6">
      <DepositsTab messId={messId} members={members || []} />
      <button
        type="button"
        onClick={() => setShowHistory(!showHistory)}
        className="w-full bg-card rounded-[18px] px-4 py-3 text-[14px] md:text-[15px] font-semibold text-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {showHistory ? "Hide History" : "View History"}
      </button>
      {showHistory && <DepositHistory deposits={deposits} />}
    </div>
  );
}
