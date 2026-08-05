"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isToday, isYesterday } from "date-fns";
import { CalendarView } from "./calendar-view";

type TabType = "all" | "personal" | "calendar";

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  announcement: {
    bg: "bg-[#ece9fe]",
    color: "text-[#6a4fd8]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C10.34 2 9 3.34 9 5V5.29C6.5 6.14 5 8.42 5 11V16L3 18V19H21V18L19 16V11C19 8.42 17.5 6.14 15 5.29V5C15 3.34 13.66 2 12 2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  group_notice: {
    bg: "bg-[#d7e6fb]",
    color: "text-[#2f6fed]",
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
    bg: "bg-[#d6f3e4]",
    color: "text-[#1fae70]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M5 20C5 16.7 8.1 14 12 14C15.9 14 19 16.7 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  event: {
    bg: "bg-[#fff2df]",
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
    bg: "bg-[#d6f3e4]",
    color: "text-[#1fae70]",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  guest_meal_accepted: {
    bg: "bg-[#d6f3e4]",
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
    bg: "bg-[#fadada]",
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
  notifications, events, bazarDuties, negativeUsers, currentUserId,
}: {
  notifications: any[];
  events: any[];
  bazarDuties: any[];
  negativeUsers: { id: string; name: string; balance: number; avatar_url: string | null }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (["all", "personal", "calendar"] as TabType[]).includes(searchParams.get("tab") as TabType)
    ? (searchParams.get("tab") as TabType)
    : "all";
  const [tab, setTab] = useState<TabType>(initialTab);

  const handleTabChange = (t: TabType) => {
    setTab(t);
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
        n.type === "leave" ||
        n.type === "removed")
  );

  const personalGroups = groupByDate(personalNotifications);
  const allGroups = groupByDate(
    notifications.filter((n) =>
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

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-[#f4f4fb] rounded-[14px] p-1.5 flex">
        {(["all", "personal", "calendar"] as TabType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all capitalize ${
              tab === t ? "bg-[#6a4fd8] text-white shadow-sm" : "text-[#8b8fa3]"
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
                <span className="text-[15px] font-bold">Negative Balance Users</span>
                <span className="text-[13px] font-semibold text-[#e5484d]">{negativeUsers.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {negativeUsers.map((u) => (
                  <div key={u.id} className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 text-center relative" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className="w-11 h-11 rounded-full object-cover bg-[#ddd]" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#6a4fd8] flex items-center justify-center text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#333] truncate">{u.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#fadada] text-[#e5484d]">
                        Negative Balance
                      </span>
                    </div>
                    <p className="text-[15px] font-bold text-[#e5484d]">৳ {Number(u.balance).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
              <div className="w-12 h-12 rounded-full bg-[#e3faf0] flex items-center justify-center mx-auto mb-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L14 9L20 9L15.5 13L17.5 19L12 15.5L6.5 19L8.5 13L4 9L10 9L12 3Z" stroke="#1fae70" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#333]">All balances are settled</p>
              <p className="text-xs text-[#999] mt-1">No member has a negative balance right now.</p>
            </div>
          )}

          {/* All Notifications */}
          {allGroups.length > 0 ? (
            <div className="space-y-3">
              {allGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-bold tracking-wider text-[#8b8fa3] px-1 mb-1.5">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((notif: any) => {
                      const style = getTypeStyle(notif.type);
                      const isUnread = !notif.read_at;
                      return (
                        <div key={notif.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-[#333] leading-snug">{notif.message}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-[#999]">
                                {formatNotifTime(new Date(notif.edited_at || notif.created_at))}
                              </p>
                              {notif.edited_at && (
                                <span className="text-[9px] text-[#6a4fd8] font-semibold bg-[#ece9fe] px-1.5 py-0.5 rounded-full">
                                  edited
                                </span>
                              )}
                              {notif.type === "group_notice" && notif.recipient_names && (
                                <span className="text-[9px] text-[#2f6fed] font-semibold bg-[#d7e6fb] px-1.5 py-0.5 rounded-full">
                                  GROUP
                                </span>
                              )}
                              {notif.type === "announcement" && (
                                <span className="text-[9px] text-[#6a4fd8] font-semibold bg-[#ece9fe] px-1.5 py-0.5 rounded-full">
                                  ANNOUNCEMENT
                                </span>
                              )}
                              {notif.type === "event" && (
                                <span className="text-[9px] text-[#d98a1c] font-semibold bg-[#fff2df] px-1.5 py-0.5 rounded-full">
                                  EVENT
                                </span>
                              )}
                              {notif.type === "event" && eventMap.get(notif.message)?.description && (
                                <p className="text-[11px] text-[#666] mt-1">
                                  {eventMap.get(notif.message)?.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {isUnread && <span className="w-2 h-2 rounded-full bg-[#6a4fd8] shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
              <p className="text-sm text-[#999]">No notifications yet</p>
            </div>
          )}
        </>
      )}

      {tab === "personal" && (
        personalGroups.length > 0 ? (
          <div className="space-y-3">
            {personalGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-bold tracking-wider text-[#8b8fa3] px-1 mb-1.5">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((notif: any) => {
                    const style = getTypeStyle(notif.type);
                    let displayMessage = notif.message;

                    if (notif.type === "assigned_bazar" && notif.user_id === currentUserId) {
                      displayMessage = "Your bazar duty has been assigned.";
                    }

                    return (
                      <div key={notif.id} className="bg-white rounded-2xl p-3.5 flex items-center gap-3" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-[#333] leading-snug">{displayMessage}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-[#999]">
                              {formatNotifTime(new Date(notif.edited_at || notif.created_at))}
                            </p>
                            {notif.edited_at && (
                              <span className="text-[9px] text-[#6a4fd8] font-semibold bg-[#ece9fe] px-1.5 py-0.5 rounded-full">
                                edited
                              </span>
                            )}
                            {notif.type === "group_notice" && (
                              <span className="text-[9px] text-[#2f6fed] font-semibold bg-[#d7e6fb] px-1.5 py-0.5 rounded-full">
                                GROUP
                              </span>
                            )}
                          </div>
                        </div>
                        {!notif.read_at && <span className="w-2 h-2 rounded-full bg-[#6a4fd8] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.8)" }}>
            <div className="w-12 h-12 rounded-full bg-[#ece9fe] flex items-center justify-center mx-auto mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#6a4fd8" strokeWidth="1.8" />
                <path d="M12 8V12L15 14" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#333]">No personal notifications</p>
            <p className="text-xs text-[#999] mt-1">Bazar duties and admin notices for you will appear here.</p>
          </div>
        )
      )}

      {tab === "calendar" && (
        <CalendarView events={events} bazarDuties={bazarDuties} />
      )}
    </div>
  );
}
