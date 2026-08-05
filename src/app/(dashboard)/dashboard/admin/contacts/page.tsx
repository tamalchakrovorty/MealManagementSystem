import Link from "next/link";
import { getAdminContext } from "../_lib/helpers";
import { query } from "@/lib/db";
import { ContactsTab } from "./contacts-tab";

export default async function ContactsPage() {
  const { messId } = await getAdminContext();
  const contacts = await query(
    "SELECT * FROM contacts WHERE mess_id = $1 ORDER BY sort_order, created_at",
    [messId]
  );

  return (
    <div className="space-y-4 max-w-lg mx-auto pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Contacts</span>
      </div>
      <ContactsTab messId={messId} contacts={contacts || []} />
    </div>
  );
}
