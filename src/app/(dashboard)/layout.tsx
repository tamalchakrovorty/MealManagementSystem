import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/shared/dashboard-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getAccessibleMesses, getSelectedMembership } from "@/lib/server-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, membership, accessibleMesses] = await Promise.all([
    queryOne("SELECT * FROM profiles WHERE id = $1", [user.id]),
    getSelectedMembership(user.id),
    getAccessibleMesses(user.id),
  ]);

  const mess = membership
    ? await queryOne("SELECT * FROM messes WHERE id = $1", [(membership as any).mess_id])
    : null;

  const isManagerOrModerator =
    (membership as any)?.role === "manager" || (membership as any)?.role === "moderator";

  const unreadResult = membership
    ? await queryOne(
        "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND mess_id = $2 AND read_at IS NULL",
        [user.id, (membership as any).mess_id]
      )
    : null;
  const unreadCount = (unreadResult as any)?.count || 0;

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <DashboardNav
        profile={profile}
        membership={membership}
        mess={mess}
        isManagerOrModerator={isManagerOrModerator}
        userEmail={user.email}
        unreadCount={unreadCount}
        accessibleMesses={accessibleMesses}
      />
      <main className="flex-1 pb-20 md:pb-0 px-5">{children}</main>
      <BottomNav isManagerOrModerator={isManagerOrModerator} unreadCount={unreadCount} />
    </div>
  );
}
