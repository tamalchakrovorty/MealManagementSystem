"use client";

import { format } from "date-fns";

export function OverviewTab({ notifications }: any) {
  return (
    <div className="space-y-3">
      {/* Recent Notifications */}
      <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <h3 className="text-[15px] font-bold mb-3">Recent Notifications</h3>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.slice(0, 10).map((n: any) => (
              <div key={n.id} className="flex justify-between items-start py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground min-w-0 truncate flex-1 mr-3">{n.message}</span>
                <span className="text-xs text-muted-foreground shrink-0">{format(new Date(n.created_at), "d MMM")}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
        )}
      </div>
    </div>
  );
}
