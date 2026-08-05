import { redirect } from "next/navigation";
import Link from "next/link";
import { query, queryOne } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSelectedMembership } from "@/lib/server-utils";

export default async function ViewsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const membership = await getSelectedMembership(user.id);
  if (!membership) redirect("/homepage");

  const views = [
    {
      id: "stock",
      label: "View Freezer Stock",
      bg: "bg-[#e2ecfb]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8C18 5.79 16.21 4 14 4C12.5 4 11.2 4.8 10.5 6" stroke="#2f6fed" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3" y="8" width="14" height="12" rx="2" stroke="#2f6fed" strokeWidth="1.8" />
          <path d="M8 13H12M8 16H12" stroke="#2f6fed" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "meals",
      label: "View Daily Meals",
      bg: "bg-[#dff3e6]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="#1fae70" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="#1fae70" strokeWidth="1.8" />
          <path d="M7 14H10" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "deposits",
      label: "View Deposits & Expenses",
      bg: "bg-[#fbe1e1]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 4V20L12 17L20 20V4H4Z" stroke="#e5484d" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 4V17" stroke="#e5484d" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "menu",
      label: "Monthly Menu",
      bg: "bg-[#ece9fb]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 5H21V19H3V5Z" stroke="#6a4fd8" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 5V19" stroke="#6a4fd8" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "report",
      label: "Final Report",
      bg: "bg-[#e2f4e4]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M7 3H14L18 7V21H7V3Z" stroke="#1fae70" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M14 3V7H18" stroke="#1fae70" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "contacts",
      label: "Important Contacts",
      bg: "bg-[#dde3f7]",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="2" width="14" height="20" rx="2" stroke="#3a4fb0" strokeWidth="1.8" />
          <path d="M9 10H15M9 14H13" stroke="#3a4fb0" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 px-1">
        <Link href="/dashboard/user" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-lg font-bold">Other Views</span>
      </div>

      {/* View Rows */}
      <div className="space-y-4 px-1">
        {views.map((view) => (
          <Link
            key={view.id}
            href={`/dashboard/user/views/${view.id}`}
            className="bg-white rounded-2xl p-5 flex items-center gap-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
          >
            <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 ${view.bg}`}>
              {view.icon}
            </div>
            <span className="flex-1 text-[15px] font-semibold">{view.label}</span>
            <svg className="text-[#bbb]" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
