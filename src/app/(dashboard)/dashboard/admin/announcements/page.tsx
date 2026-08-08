import Link from "next/link";
import { query } from "@/lib/db";
import { getAdminContext } from "../_lib/helpers";
import { NoticesTab } from "../tabs/notices-tab";

export const dynamic = "force-dynamic";

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
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Announcements</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Post notices and events</p>
        </div>
      </div>
      <NoticesTab messId={messId} notices={notices || []} members={members || []} events={events || []} />
    </div>
  );
}
