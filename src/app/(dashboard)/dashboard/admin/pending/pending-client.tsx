"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface PendingProps {
  leaveRequests: any[];
  joinRequests: any[];
  overdueBazarDuties: any[];
  mealOffRequests: any[];
  guestMealRequests: any[];
  missingMealDays: any[];
}

const SECTION_META: Record<string, { icon: React.ReactNode; color: string; bg: string; href: string }> = {
  leave: {
    color: "#c8790b", bg: "#fbe9c9", href: "/dashboard/admin/members",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  join: {
    color: "#6a4fd8", bg: "#ece9fe", href: "/dashboard/admin/requests/join",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 6V12M13 9H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  bazar: {
    color: "#d98a1c", bg: "#fbe9d3", href: "/dashboard/admin/assign-bazar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8V6C8 4.34 9.34 3 11 3H13C14.66 3 16 4.34 16 6V8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  mealOff: {
    color: "#e5484d", bg: "#fadada", href: "/dashboard/admin/requests/meal-off-on",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  guestMeal: {
    color: "#d98a1c", bg: "#fbe4cf", href: "/dashboard/admin/requests/guest-meals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="8.5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="15.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 19C3 15.5 5.5 13 8.5 13C10 13 11.3 13.6 12.2 14.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 19C12 16.5 13.5 14.5 15.5 14.5C17.8 14.5 19.5 16.3 19.5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  missingMeals: {
    color: "#e5484d", bg: "#fadada", href: "/dashboard/admin/meals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C10.34 2 9 3.34 9 5V5.29C6.5 6.14 5 8.42 5 11V16L3 18V19H21V18L19 16V11C19 8.42 17.5 6.14 15 5.29V5C15 3.34 13.66 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
};

export function PendingClient({
  leaveRequests,
  joinRequests,
  overdueBazarDuties,
  mealOffRequests,
  guestMealRequests,
  missingMealDays,
}: PendingProps) {
  const sections: Array<{ key: string; title: string; items: any[]; renderItem: (item: any) => React.ReactNode }> = [
    {
      key: "leave",
      title: "Leave Requests",
      items: leaveRequests,
      renderItem: (r) => (
        <>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0 relative">
            {r.avatar_url ? (
              <Image src={r.avatar_url} alt="" fill className="rounded-full object-cover" />
            ) : (
              r.name?.charAt(0)?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{r.name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "d MMM, h:mm a")}</p>
          </div>
        </>
      ),
    },
    {
      key: "join",
      title: "Join Requests",
      items: joinRequests,
      renderItem: (r) => (
        <>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {r.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{r.name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "d MMM, h:mm a")}</p>
          </div>
        </>
      ),
    },
    {
      key: "bazar",
      title: "Overdue Bazar Duties",
      items: overdueBazarDuties,
      renderItem: (r) => {
        const rawDate = r.assigned_date;
        const assignedDate = typeof rawDate === "string" ? rawDate.split("T")[0] : format(rawDate, "yyyy-MM-dd");
        return (
          <>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                r.name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{r.name || "Unknown"}</p>
              <p className="text-[10px] text-muted-foreground">Assigned {assignedDate}</p>
            </div>
          </>
        );
      },
    },
    {
      key: "mealOff",
      title: "Meal Off/On Requests",
      items: mealOffRequests,
      renderItem: (r) => (
        <>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {r.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{r.name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "d MMM, h:mm a")}</p>
          </div>
        </>
      ),
    },
    {
      key: "guestMeal",
      title: "Guest Meal Requests",
      items: guestMealRequests,
      renderItem: (r) => (
        <>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
            {r.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{r.name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "d MMM, h:mm a")}</p>
          </div>
        </>
      ),
    },
    {
      key: "missingMeals",
      title: "Missing Meal Updates",
      items: missingMealDays,
      renderItem: (d) => {
        const rawDate = d.date;
        const dateObj = typeof rawDate === "string" ? new Date(rawDate + "T00:00:00") : rawDate;
        return (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#e5484d]">
              {format(dateObj, "EEE, d MMM yyyy")}
            </p>
            <p className="text-[10px] text-muted-foreground">No meals entered for this day</p>
          </div>
        );
      },
    },
  ];

  const visibleSections = sections.filter((s) => s.items.length > 0);

  if (visibleSections.length === 0) {
    return (
      <div className="bg-card rounded-[18px] p-8 md:p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
        <div className="w-12 h-12 rounded-full bg-[#d7f2e9] flex items-center justify-center mx-auto mb-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L14 9L20 9L15.5 13L17.5 19L12 15.5L6.5 19L8.5 13L4 9L10 9L12 3Z" stroke="#1fae70" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground">All clear!</p>
        <p className="text-xs text-muted-foreground mt-1">No pending items right now.</p>
      </div>
    );
  }

  return (
    <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
      {visibleSections.map((section) => {
        const meta = SECTION_META[section.key];
        return (
          <div key={section.key} className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-[10px] flex items-center justify-center" style={{ background: meta.bg, color: meta.color }}>
                  {meta.icon}
                </div>
                <span className="text-[14px] md:text-[15px] font-bold text-foreground">{section.title}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                {section.items.length}
              </span>
            </div>
            <div className="space-y-2.5 mb-3">
              {section.items.slice(0, 5).map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center gap-2.5 border-b border-border pb-2.5 last:border-0 last:pb-0">
                  {section.renderItem(item)}
                </div>
              ))}
              {section.items.length > 5 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  + {section.items.length - 5} more
                </p>
              )}
            </div>
            <Link
              href={meta.href}
              className="block text-center text-[12px] md:text-[13px] font-bold py-2.5 md:py-3 rounded-xl transition-colors hover:opacity-80"
              style={{ color: meta.color, background: meta.bg }}
            >
              View all →
            </Link>
          </div>
        );
      })}
    </div>
  );
}
