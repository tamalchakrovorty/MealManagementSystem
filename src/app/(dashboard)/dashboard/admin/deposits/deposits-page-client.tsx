"use client";

import { useState } from "react";
import { DepositsTab } from "../tabs/deposits-tab";
import { DepositHistory } from "../tabs/deposit-history";

export function DepositsPageClient({ messId, members }: { messId: string; members: any[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto pb-24">
      <DepositsTab messId={messId} members={members || []} onSaved={() => setRefreshKey((k) => k + 1)} />
      <DepositHistory messId={messId} refreshKey={refreshKey} />
    </div>
  );
}
