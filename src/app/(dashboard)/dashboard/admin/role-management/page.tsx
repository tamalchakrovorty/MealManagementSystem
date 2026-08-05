import Link from "next/link";
import { getAdminContext, getMembers } from "../_lib/helpers";
import { RoleManagementClient } from "./role-management-client";

export default async function RoleManagementPage() {
  const { user, messId, membership } = await getAdminContext();
  const isManager = (membership as any).role === "manager";
  const members = await getMembers(messId);

  return (
    <div className="space-y-4 max-w-lg mx-auto pt-4 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-lg font-bold">Role Management</span>
      </div>
      <RoleManagementClient members={members || []} messId={messId} currentUserId={user.id} isManager={isManager} />
    </div>
  );
}
