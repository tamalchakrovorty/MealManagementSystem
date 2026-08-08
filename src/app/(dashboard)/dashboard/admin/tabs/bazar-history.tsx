"use client";

import Image from "next/image";

interface Expense {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
  notes: string | null;
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function BazarHistory({ expenses }: { expenses: Expense[] }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonth = expenses.filter((e) => {
    const eDate = new Date(e.date + "T00:00:00");
    return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
  });

  return (
    <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <h3 className="text-[15px] md:text-[17px] font-bold mb-4">
        This Month&apos;s Expenses
      </h3>
      {thisMonth.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No expenses this month</p>
      ) : (
        <div className="space-y-1 max-h-[32rem] overflow-y-auto">
          {thisMonth.map((e) => {
            const colorClass = getAvatarColor(e.name || "U");
            return (
              <div key={e.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg md:hover:bg-muted md:transition-colors">
                {e.avatar_url ? (
                  <Image src={e.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${colorClass}`}>
                    {(e.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] md:text-[14px] font-semibold text-foreground truncate">{e.name || "Unknown"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(e.date)}{e.notes ? ` · ${e.notes}` : ""}</p>
                </div>
                <span className="text-[13px] md:text-[14px] font-bold shrink-0 text-[#e5484d]">
                  ৳{Number(e.amount).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
