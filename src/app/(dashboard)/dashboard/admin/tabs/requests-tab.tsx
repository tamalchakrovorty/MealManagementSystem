"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { popup } from "@/lib/popup";

export function RequestsTab({
  messId, mealRequests, guestMealRequests, joinRequests, stockAccessRequests, members,
}: {
  messId: string; mealRequests: any[]; guestMealRequests: any[]; joinRequests: any[]; stockAccessRequests?: any[]; members?: any[];
}) {
  const router = useRouter();

  const handleRequest = async (requestId: string, status: "approved" | "rejected", type: string) => {
    const res = await fetch("/api/admin/requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success(`${type} request ${status}`); router.refresh(); }
  };

  const handleJoinApprove = async (requestId: string, userId: string) => {
    const res = await fetch("/api/admin/requests/approve-join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, mess_id: messId, userId }),
    });
    if (!res.ok) { const d = await res.json(); popup.error(d.error); }
    else { popup.success("Member approved and added"); router.refresh(); }
  };

  const getMemberName = (userId: string) => {
    const member = members?.find((m: any) => m.id === userId || m.user_id === userId);
    return member?.name || member?.full_name || userId;
  };

  const getMealOptionBadge = (option: string) => {
    switch (option) {
      case "off": return { label: "OFF", color: "#e5484d", bg: "#fadada" };
      case "rice_only": return { label: "Rice Only", color: "#d98a1c", bg: "#fff2df" };
      case "curry_only": return { label: "Curry Only", color: "#c47a20", bg: "#fef3e2" };
      default: return { label: "On", color: "#1fae70", bg: "#e3faf0" };
    }
  };

  const getGuestMealBadge = (type: string) => {
    switch (type) {
      case "rice_only": return { label: "Rice Only", color: "#d98a1c", bg: "#fff2df" };
      case "curry_only": return { label: "Curry Only", color: "#c47a20", bg: "#fef3e2" };
      default: return { label: "Full Meal", color: "#1fae70", bg: "#e3faf0" };
    }
  };

  const renderList = (items: any[], label: string, color: string, onApprove?: (id: string, userId: string) => void) => {
    const pendingCount = items?.filter((r: any) => r.status === "pending").length || 0;
    return (
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold">{label}</h3>
          {pendingCount > 0 && (
            <span className="bg-[#2f6fed] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </div>
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((req: any) => {
              const isGuestMeal = label === "Guest Meal Requests";
              const isMealOff = label === "Meal Off/On Requests";
              const details = (isGuestMeal || isMealOff) && typeof req.details === "string" ? JSON.parse(req.details) : req.details;
              const guestNames = isGuestMeal && details?.guests?.length
                ? details.guests.map((g: any) => g.name).join(", ")
                : req.name || "Unknown";
              const totalMeals = isGuestMeal && details?.guests?.length
                ? details.guests.reduce((sum: number, g: any) => sum + g.lunch + g.dinner, 0)
                : null;
              const sharedMembers = isGuestMeal && details?.guests?.some((g: any) => g.shared_with?.length > 0)
                ? [...new Set<string>(details.guests.flatMap((g: any) => (g.shared_with || []) as string[]))]
                : [];

              const lunchBadge = isMealOff ? getMealOptionBadge(details?.lunch || "on") : null;
              const dinnerBadge = isMealOff ? getMealOptionBadge(details?.dinner || "on") : null;

              return (
                <div key={req.id} className="py-2.5 border-b border-[#f0f0f5] last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#333] truncate">{isMealOff ? (req.name || "Unknown") : guestNames}</p>
                      {isMealOff && (lunchBadge || dinnerBadge) && (
                        <div className="flex gap-2 mt-1.5">
                          {lunchBadge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: lunchBadge.color, background: lunchBadge.bg }}>
                              Lunch: {lunchBadge.label}
                            </span>
                          )}
                          {dinnerBadge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: dinnerBadge.color, background: dinnerBadge.bg }}>
                              Dinner: {dinnerBadge.label}
                            </span>
                          )}
                        </div>
                      )}
                      {isGuestMeal && details?.guests?.length > 0 ? (
                        <div className="mt-1 space-y-1">
                          {details.guests.map((g: any, i: number) => {
                            const gLunchBadge = g.lunch > 0 ? getGuestMealBadge(g.lunch_type || "full") : null;
                            const gDinnerBadge = g.dinner > 0 ? getGuestMealBadge(g.dinner_type || "full") : null;
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-[#333]">{g.name}:</p>
                                <div className="flex gap-1">
                                  {gLunchBadge && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: gLunchBadge.color, background: gLunchBadge.bg }}>
                                      L: {gLunchBadge.label}
                                    </span>
                                  )}
                                  {gDinnerBadge && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: gDinnerBadge.color, background: gDinnerBadge.bg }}>
                                      D: {gDinnerBadge.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {sharedMembers.length > 0 && (
                            <p className="text-xs text-[#6a4fd8] font-medium">
                              Shared with: {sharedMembers.map((id: string) => getMemberName(id)).join(", ")}
                            </p>
                          )}
                        </div>
                      ) : null}
                      <p className="text-xs text-[#999] mt-1">
                        {details?.dates?.length
                          ? `${format(new Date(details.dates[0]), "d MMM")} – ${format(new Date(details.dates[details.dates.length - 1]), "d MMM, yyyy")}`
                          : details?.date
                            ? format(new Date(details.date), "d MMM, yyyy")
                            : format(new Date(req.created_at), "d MMM, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      {req.status === "pending" ? (
                        <>
                          <button onClick={() => onApprove ? onApprove(req.id, req.user_id) : handleRequest(req.id, "approved", label)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#d9f2e0] text-[#1fae70]">
                            Approve
                          </button>
                          <button onClick={() => handleRequest(req.id, "rejected", label)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#fadada] text-[#e5484d]">
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${req.status === "approved" ? "bg-[#d9f2e0] text-[#1fae70]" : "bg-[#fadada] text-[#e5484d]"}`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#999] text-center py-4">No requests</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {joinRequests && joinRequests.length > 0 && renderList(joinRequests, "Join Requests", "#6a4fd8", handleJoinApprove)}
      {renderList(mealRequests, "Meal Off/On Requests", "#e5484d")}
      {guestMealRequests && guestMealRequests.length > 0 && renderList(guestMealRequests, "Guest Meal Requests", "#d98a1c")}
      {stockAccessRequests && stockAccessRequests.length > 0 && renderList(stockAccessRequests, "Stock Access Requests", "#2f6fed")}
    </div>
  );
}
