import { redirect } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { ContactsView } from "./contacts-view";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const contacts = await query(
    "SELECT id, name, category, phone, description FROM contacts WHERE mess_id = $1 ORDER BY sort_order, created_at",
    [(membership as any).mess_id]
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-2">
          <Link
            href="/dashboard/user/views"
            className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Important Contacts</h1>
            <p className="text-[13px] md:text-[15px] text-muted-foreground">Quick access to key contacts</p>
          </div>
        </div>

        {/* Content */}
        <div className="pt-3 pb-8">
          <ContactsView contacts={(contacts as any) || []} />
        </div>
      </div>
    </div>
  );
}
