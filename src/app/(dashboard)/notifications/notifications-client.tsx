"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { CalendarView } from "./calendar-view";

type TabType = "all" | "personal" | "calendar";

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  announcement: {
    bg: "bg-primary/10",
    color: "text-primary",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C10.34 2 9 3.34 9 5V5.29C6.5 6.14 5 8.42 5 11V16L3 18V19H21V18L19 16V11C19 8.42 17.5 6.14 15 5.29V5C15 3.34 13.66 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  group_notice: {
    bg: "bg-primary/10",
    color: "text-primary",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 14C18.3 14 21 16.7 21 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  personal_notice: {
    bg: "bg-[#1fae70]/10",
    color: "text-[#1fae70]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20C5 16.7 8.1 14 12 14C15.9 14 19 16.7 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  event: {
    bg: "bg-[#d98a1c]/10",
    color: "text-[#d98a1c]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 2V5M16 2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  assigned_bazar: {
    bg: "bg-[#fdeccb]",
    color: "text-[#c8790b]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 21V9L12 3L20 9V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 21V13H15V21" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  meal_request_accepted: {
    bg: "bg-[#1fae70]/10",
    color: "text-[#1fae70]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  guest_meal_accepted: {
    bg: "bg-[#1fae70]/10",
    color: "text-[#1fae70]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M21 12C21 16.4183 16.9706 20 12 20C10.6592 20 9.38912 19.7401 8.25 19.2727L3 20L4.5 16C3.55603 14.8952 3 13.5 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  leave: {
    bg: "bg-[#ede9fe]",
    color: "text-[#6a4fd8]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  removed: {
    bg: "bg-destructive/10",
    color: "text-[#e5484d]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
};

function getTypeStyle(type: string) {
  return TYPE_STYLE[type] || TYPE_STYLE.announcement;
}

function formatNotifTime(date: Date): string {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
}

function groupByDate(items: any[]): Array<{ label: string; items: any[] }> {
  const groups = new Map<string, any[]>();
  for (const n of items) {
    const date = new Date(n.edited_at || n.created_at);
    let key: string;
    if (isToday(date)) key = "Today";
    else if (isYesterday(date)) key = "Yesterday";
    else key = format(date, "d MMM, yyyy");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function NotificationsClient({
  notifications, events, bazarDuties, activityLogs, negativeUsers, currentUserId,
}: {
  notifications: any[];
  events: any[];
  bazarDuties: any[];
  activityLogs: any[];
  negativeUsers: { id: string; name: string; balance: number; avatar_url: string | null; status: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (["all", "personal", "calendar"] as TabType[]).includes(searchParams.get("tab") as TabType)
    ? (searchParams.get("tab") as TabType)
    : "all";
  const [tab, setTab] = useState<TabType>(initialTab);
  const [filter, setFilter] = useState<"all" | "unseen">("unseen");

  const handleTabChange = (t: TabType) => {
    setTab(t);
    setFilter("all");
    router.replace(`?tab=${t}`, { scroll: false });
  };

  const eventMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of events) {
      map.set(`New event: ${e.title} on ${e.event_date}`, e);
    }
    return map;
  }, [events]);

  const personalNotifications = notifications.filter(
    (n) =>
      n.user_id === currentUserId &&
      (n.type === "assigned_bazar" ||
        n.type === "group_notice" ||
        n.type === "personal_notice" ||
        n.type === "meal_request_accepted" ||
        n.type === "guest_meal_accepted" ||
        (n.type === "leave" && n.message.startsWith("Your")) ||
        n.type === "removed")
  );

  const personalGroups = groupByDate(personalNotifications);
  const allGroups = groupByDate(
    notifications.filter((n) =>
      n.type === "join_accepted" ||
      n.type === "announcement" ||
      n.type === "assigned_bazar" ||
      n.type === "event" ||
      n.type === "meal_request_accepted" ||
      n.type === "guest_meal_accepted" ||
      n.type === "leave" ||
      n.type === "removed" ||
      ((n.type === "group_notice" || n.type === "personal_notice") && n.user_id === currentUserId)
    )
  );

  const filteredAllGroups = filter === "unseen"
    ? allGroups.map(g => ({ ...g, items: g.items.filter((n: any) => !n.read_at) })).filter(g => g.items.length > 0)
    : allGroups;

  const filteredPersonalGroups = filter === "unseen"
    ? personalGroups.map(g => ({ ...g, items: g.items.filter((n: any) => !n.read_at) })).filter(g => g.items.length > 0)
    : personalGroups;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-muted rounded-[14px] p-1.5 flex">
        {(["all", "personal", "calendar"] as TabType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-2.5 md:py-3 rounded-[10px] text-[13px] md:text-[15px] font-bold transition-all capitalize ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          {/* Negative Balance Users */}
          {negativeUsers.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[15px] md:text-[17px] font-bold">Negative Balance Users</span>
                <span className="text-[13px] md:text-[15px] font-semibold text-[#e5484d]">{negativeUsers.length}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {negativeUsers.map((u) => (
                  <div key={u.id} className="bg-card rounded-2xl p-2.5 md:p-3 flex flex-col items-center gap-1.5 text-center relative shadow-[0_8px_24px_rgba(0,0,0,.04)]">
                    {u.status !== "active" && (
                      <div
                        className="absolute text-white text-[10px] font-bold leading-none z-10"
                        style={{
                          "--f": "0.45em",
                          "--r": "0.9em",
                          right: "12px",
                          top: "calc(-1 * var(--f))",
                          padding: "0.2em 0.4em",
                          border: "solid transparent",
                          borderWidth: "0 calc(2 * var(--f)) var(--r) 0",
                          background: "radial-gradient(50% 100% at bottom, #0005 98%, transparent 101%) 100% 0/calc(2 * var(--f)) var(--f) no-repeat border-box",
                          backgroundColor: "#e5484d",
                          borderRadius: "var(--f) var(--f) 0 0",
                          clipPath: "polygon(100% 0, 0 0, 0 calc(100% - var(--r)), calc(50% - var(--f)) 100%, calc(100% - 2*var(--f)) calc(100% - var(--r)), calc(100% - 2*var(--f)) var(--f), 100% var(--f))",
                        } as React.CSSProperties}
                      >
                        {u.status === "left" ? "Left" : "Removed"}
                      </div>
                    )}
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover bg-muted" />
                    ) : (
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] md:text-[13px] font-semibold text-foreground truncate">{u.name}</p>
                      <span className="text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-[#e5484d]">
                        Negative Balance
                      </span>
                    </div>
                    <p className="text-[13px] md:text-[15px] font-bold text-[#e5484d]">৳ {Number(u.balance).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 md:p-10 text-center shadow-[0_8px_24px_rgba(0,0,0,.04)]">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1fae70]/10 flex items-center justify-center mx-auto mb-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L14 9L20 9L15.5 13L17.5 19L12 15.5L6.5 19L8.5 13L4 9L10 9L12 3Z" stroke="#1fae70" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm md:text-[15px] font-semibold text-foreground">All balances are settled</p>
              <p className="text-xs md:text-[13px] text-muted-foreground mt-1">No member has a negative balance right now.</p>
            </div>
          )}

          {/* Filter Toggle */}
          <div className="flex gap-2 px-1">
            {(["unseen", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[12px] md:text-[13px] font-semibold transition-all capitalize ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {f === "unseen" ? "Unseen" : "All"}
              </button>
            ))}
          </div>

          {/* All Notifications */}
          {filteredAllGroups.length > 0 ? (
            <div className="space-y-3">
              {filteredAllGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] md:text-[12px] font-bold tracking-wider text-muted-foreground px-1 mb-1.5">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((notif: any) => {
                      const style = getTypeStyle(notif.type);
                      const isUnread = !notif.read_at;
                      return (
                        <div key={notif.id} className="bg-card rounded-2xl p-3.5 md:p-4 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,.04)]">
                          <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] md:text-[15px] font-semibold text-foreground leading-snug">{notif.message}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] md:text-[11px] text-muted-foreground">
                                {formatNotifTime(new Date(notif.edited_at || notif.created_at))}
                              </p>
                              {notif.edited_at && (
                                <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  edited
                                </span>
                              )}
                              {notif.type === "group_notice" && notif.recipient_names && (
                                <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  GROUP
                                </span>
                              )}
                              {notif.type === "announcement" && (
                                <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  ANNOUNCEMENT
                                </span>
                              )}
                              {notif.type === "event" && (
                                <span className="text-[9px] text-[#d98a1c] font-semibold bg-[#d98a1c]/10 px-1.5 py-0.5 rounded-full">
                                  EVENT
                                </span>
                              )}
                              {notif.type === "event" && eventMap.get(notif.message)?.description && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {eventMap.get(notif.message)?.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {isUnread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 md:p-10 text-center shadow-[0_8px_24px_rgba(0,0,0,.04)]">
              <p className="text-sm md:text-[15px] text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </>
      )}

      {tab === "personal" && (
        <>
          {/* Filter Toggle */}
          <div className="flex gap-2 px-1">
            {(["unseen", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[12px] md:text-[13px] font-semibold transition-all capitalize ${
                  filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {f === "unseen" ? "Unseen" : "All"}
              </button>
            ))}
          </div>

          {filteredPersonalGroups.length > 0 ? (
          <div className="space-y-3">
            {filteredPersonalGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] md:text-[12px] font-bold tracking-wider text-muted-foreground px-1 mb-1.5">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((notif: any) => {
                    const style = getTypeStyle(notif.type);
                    let displayMessage = notif.message;

                    if (notif.type === "assigned_bazar" && notif.user_id === currentUserId) {
                      displayMessage = "Your bazar duty has been assigned.";
                    }

                    return (
                      <div key={notif.id} className="bg-card rounded-2xl p-3.5 md:p-4 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,.04)]">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] md:text-[15px] font-semibold text-foreground leading-snug">{displayMessage}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-muted-foreground">
                              {formatNotifTime(new Date(notif.edited_at || notif.created_at))}
                            </p>
                            {notif.edited_at && (
                              <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                                edited
                              </span>
                            )}
                            {notif.type === "group_notice" && (
                              <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                                GROUP
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-8 md:p-10 text-center shadow-[0_8px_24px_rgba(0,0,0,.04)]">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm md:text-[15px] font-semibold text-foreground">No personal notifications</p>
            <p className="text-xs md:text-[13px] text-muted-foreground mt-1">Bazar duties and admin notices for you will appear here.</p>
          </div>
        )}
        </>
      )}

      {tab === "calendar" && (
        <CalendarView events={events} bazarDuties={bazarDuties} activityLogs={activityLogs} />
      )}
    </div>
  );
}
