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
      bg: "bg-primary/10",
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
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-5 pb-2">
        <Link
          href="/dashboard/user"
          className="w-[46px] h-[46px] min-w-[46px] bg-card rounded-[14px] flex items-center justify-center shadow-[0_2px_6px_rgba(30,30,60,0.06)]"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] md:text-[28px] font-extrabold text-foreground leading-tight">Other Views</h1>
          <p className="text-[13px] md:text-[15px] text-muted-foreground">Browse detailed reports</p>
        </div>
      </div>

      {/* View Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {views.map((view) => (
          <Link
            key={view.id}
            href={`/dashboard/user/views/${view.id}`}
            className="bg-card rounded-[18px] p-5 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
          >
            <div className={`w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shrink-0 ${view.bg}`}>
              {view.icon}
            </div>
            <span className="flex-1 text-[15px] md:text-[16px] font-semibold text-foreground">{view.label}</span>
            <svg className="text-[#bbb]" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
