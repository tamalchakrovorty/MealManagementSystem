import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext, getMembers, getPendingMembers } from "../_lib/helpers";
import { MembersTab } from "../tabs/members-tab";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { messId } = await getAdminContext();
  const [members, pendingMembers, bazarDuties] = await Promise.all([
    getMembers(messId),
    getPendingMembers(messId),
    query(
      `SELECT bd.*, p.name as user_name, p.avatar_url
       FROM bazar_duties bd
       LEFT JOIN profiles p ON p.id = bd.user_id
       WHERE bd.mess_id = $1
       ORDER BY bd.assigned_date DESC, bd.created_at DESC`,
      [messId]
    ),
  ]);

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
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Assign Bazar</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Assign shopping duties to members</p>
        </div>
      </div>
      <MembersTab messId={messId} members={members || []} pendingMembers={pendingMembers || []} bazarDuties={bazarDuties || []} />
    </div>
  );
}
