import Link from "next/link";
import { getAdminContext } from "../_lib/helpers";
import { query } from "@/lib/db";
import { ContactsTab } from "./contacts-tab";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const { messId } = await getAdminContext();
  const contacts = await query(
    "SELECT * FROM contacts WHERE mess_id = $1 ORDER BY sort_order, created_at",
    [messId]
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
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
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Contacts</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Manage important contacts</p>
        </div>
      </div>
      <ContactsTab messId={messId} contacts={contacts || []} />
    </div>
  );
}
