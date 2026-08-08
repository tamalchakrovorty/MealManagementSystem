import Link from "next/link";
import { getAdminContext, getMembers } from "../_lib/helpers";
import { DepositsPageClient } from "./deposits-page-client";

export default async function DepositsPage() {
  const { messId } = await getAdminContext();
  const members = await getMembers(messId);

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 pt-5 pb-2">
        <Link
          href="/dashboard/admin"
          className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Input Deposit</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Record member deposits</p>
        </div>
      </div>
      <DepositsPageClient messId={messId} members={members || []} />
    </div>
  );
}
