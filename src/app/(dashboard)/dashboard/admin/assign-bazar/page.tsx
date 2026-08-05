import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext, getMembers, getPendingMembers } from "../_lib/helpers";
import { MembersTab } from "../tabs/members-tab";

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
    <div className="space-y-4 max-w-lg mx-auto pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Assign Bazar</span>
      </div>
      <MembersTab messId={messId} members={members || []} pendingMembers={pendingMembers || []} bazarDuties={bazarDuties || []} />
    </div>
  );
}
