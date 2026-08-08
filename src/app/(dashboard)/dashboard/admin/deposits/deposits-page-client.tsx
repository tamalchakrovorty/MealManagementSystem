"use client";

import { useState } from "react";
import { DepositsTab } from "../tabs/deposits-tab";
import { DepositHistory } from "../tabs/deposit-history";

export function DepositsPageClient({ messId, members, deposits }: { messId: string; members: any[]; deposits: any[] }) {
  const [tab, setTab] = useState<"input" | "history">("input");

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-card rounded-[16px] p-1.5 flex">
        <button
          type="button"
          onClick={() => setTab("input")}
          className={`flex-1 py-2.5 md:py-3 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            tab === "input" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Input Deposit
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`flex-1 py-2.5 md:py-3 rounded-[12px] text-[13px] md:text-[15px] font-bold transition-all ${
            tab === "history" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          History
        </button>
      </div>
      {tab === "input" ? (
        <DepositsTab messId={messId} members={members || []} />
      ) : (
        <DepositHistory deposits={deposits} />
      )}
    </div>
  );
}
