"use client";

import { format } from "date-fns";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
  name: string;
  avatar_url: string | null;
}

const avatarPastels = [
  "bg-[#E8F8F0] text-[#18B875]",
  "bg-[#FEF3C7] text-[#F59E0B]",
  "bg-primary/10 text-primary",
  "bg-[#DBEAFE] text-[#2F80ED]",
  "bg-[#FCE7F3] text-[#EC4899]",
  "bg-[#CCFBF1] text-[#14B8A6]",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarPastels[Math.abs(hash) % avatarPastels.length];
}

export function DepositHistory({ deposits }: { deposits: Deposit[] }) {
  const grouped = new Map<string, Deposit[]>();
  for (const d of deposits) {
    const key = d.date;
    const list = grouped.get(key) || [];
    list.push(d);
    grouped.set(key, list);
  }

  return (
    <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <h3 className="text-[15px] md:text-[17px] font-bold mb-4">Deposit History</h3>
      {deposits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No deposits yet</p>
      ) : (
        <div className="space-y-3 max-h-[28rem] overflow-y-auto">
          {Array.from(grouped.entries()).map(([dateKey, items]) => {
            const date = new Date(dateKey + "T00:00:00");
            const now = new Date();
            const isToday = format(now, "yyyy-MM-dd") === dateKey;
            const isYesterday = format(new Date(now.getTime() - 86400000), "yyyy-MM-dd") === dateKey;
            let dateLabel: string;
            if (isToday) dateLabel = "Today";
            else if (isYesterday) dateLabel = "Yesterday";
            else dateLabel = format(date, "EEE, d MMM");

            const dayTotal = items.reduce((s, d) => s + Number(d.amount), 0);

            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] md:text-[12px] font-semibold text-muted-foreground">{dateLabel}</span>
                  <span className={`text-[11px] md:text-[12px] font-bold ${dayTotal >= 0 ? "text-[#18B875]" : "text-[#e5484d]"}`}>
                    ৳{dayTotal.toFixed(0)}
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((d) => {
                    const colorClass = getAvatarColor(d.name || "U");
                    return (
                      <div key={d.id} className="flex items-center gap-3 py-2 px-2 rounded-lg md:hover:bg-muted md:transition-colors">
                        {d.avatar_url ? (
                          <img src={d.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${colorClass}`}>
                            {(d.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] md:text-[14px] font-semibold text-foreground truncate">{d.name || "Unknown"}</p>
                        </div>
                        <span className={`text-[13px] md:text-[14px] font-bold shrink-0 ${Number(d.amount) >= 0 ? "text-[#18B875]" : "text-[#e5484d]"}`}>
                          {Number(d.amount) >= 0 ? "+" : ""}৳{Number(d.amount).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
