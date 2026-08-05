import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext } from "../_lib/helpers";
import { NoticesTab } from "../tabs/notices-tab";

export default async function AnnouncementsPage() {
  const { messId } = await getAdminContext();
  const [notices, members, events] = await Promise.all([
    query(
      `SELECT n.*, p.name as author_name FROM notices n
       LEFT JOIN profiles p ON p.id = n.author_id
       WHERE n.mess_id = $1 ORDER BY COALESCE(n.edited_at, n.created_at) DESC`,
      [messId]
    ),
    query(
      `SELECT m.user_id, p.name, p.avatar_url FROM memberships m
       LEFT JOIN profiles p ON p.id = m.user_id
       WHERE m.mess_id = $1 AND m.status = 'active'`,
      [messId]
    ),
    query(
      `SELECT e.*, p.name as author_name FROM events e
       LEFT JOIN profiles p ON p.id = e.author_id
       WHERE e.mess_id = $1 ORDER BY e.event_date DESC`,
      [messId]
    ),
  ]);

  return (
    <div className="space-y-4 max-w-lg mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Announcements</span>
      </div>
      <NoticesTab messId={messId} notices={notices || []} members={members || []} events={events || []} />
    </div>
  );
}
