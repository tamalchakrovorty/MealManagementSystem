import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/shared/dashboard-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";
import { getProfile, getAccessibleMesses, getMessFull, getUnreadCount } from "@/lib/cached-queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, membership, accessibleMesses] = await Promise.all([
    getProfile(user.id),
    getSelectedMembership(user.id),
    getAccessibleMesses(user.id),
  ]);

  const messId = (membership as any)?.mess_id;

  const [mess, unreadCount] = await Promise.all([
    messId ? getMessFull(messId) : null,
    messId ? getUnreadCount(user.id, messId) : 0,
  ]);

  const isManagerOrModerator =
    (membership as any)?.role === "manager" || (membership as any)?.role === "moderator";

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
