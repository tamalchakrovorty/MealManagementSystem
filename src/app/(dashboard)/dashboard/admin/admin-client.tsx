"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { popup } from "@/lib/popup";
import { AdminStats } from "./admin-stats";
import { MonthPickerField } from "../user/month-picker-field";

interface Props {
  mess: any;
  membership: any;
  memberCount: number;
  totalPendingCount: number;
  pendingJoinCount: number;
  pendingMealCount: number;
  pendingGuestCount: number;
  contactCount: number;
}

interface Tile {
  id: string;
  label: string;
  icon: React.ReactNode;
  bg: string;
  badge?: string;
  href: string;
}

export function AdminDashboardClient({
  mess,
  membership,
  memberCount,
  totalPendingCount,
  pendingJoinCount,
  pendingMealCount,
  pendingGuestCount,
  contactCount,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [dlScope, setDlScope] = useState<"full">("full");
  const [dlPeriod, setDlPeriod] = useState<"single" | "range">("single");
  const [dlMonth, setDlMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [dlStart, setDlStart] = useState(() => format(new Date(), "yyyy-MM"));
  const [dlEnd, setDlEnd] = useState(() => format(new Date(), "yyyy-MM"));

  const handleDownloadLog = async () => {
    const start = dlPeriod === "single" ? dlMonth : dlStart;
    const end = dlPeriod === "single" ? dlMonth : dlEnd;
    if (start > end) {
      popup.error("Start month cannot be after end month");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/user/download-log?messId=${mess.id}&scope=${dlScope}&start=${start}&end=${end}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        popup.error(data.error || "Download failed");
        setLoading(false);
        return;
      }
      const skipped = Number(res.headers.get("X-Skipped-Months") || 0);
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] || `download.xlsx`;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(blobUrl);
      if (skipped > 0) {
        popup.success(`${skipped} month${skipped > 1 ? "s" : ""} with no data skipped`);
      } else {
        popup.success("Excel file downloaded");
      }
    } catch {
      popup.error("Download failed");
    }
    setLoading(false);
  };

  const tiles: Tile[] = [
    {
      id: "notices",
      label: "Announcements",
      href: "/dashboard/admin/announcements",
      bg: "bg-[#ece9fb]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 11L18 5V19L3 13V11Z" stroke="#6a4fd8" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M7 13V17C7 18.1 7.9 19 9 19" stroke="#6a4fd8" strokeWidth="1.8" />
          <path d="M18 9C19.5 9.5 21 10.5 21 12C21 13.5 19.5 14.5 18 15" stroke="#6a4fd8" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "meals",
      label: "Input Meal",
      href: "/dashboard/admin/meals",
      bg: "bg-[#d7f2e9]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M18 8C18 5.79 16.21 4 14 4C12.5 4 11.2 4.8 10.5 6" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="3" y="8" width="14" height="12" rx="2" stroke="#1fae70" strokeWidth="1.8" />
          <path d="M8 13H12M8 16H12" stroke="#1fae70" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "bazar",
      label: "Input Bazar",
      href: "/dashboard/admin/bazar",
      bg: "bg-[#fbe9d3]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="8" width="16" height="12" rx="2" stroke="#d98a1c" strokeWidth="1.8" />
          <path d="M8 8V6C8 4.34 9.34 3 11 3H13C14.66 3 16 4.34 16 6V8" stroke="#d98a1c" strokeWidth="1.8" />
          <circle cx="12" cy="14" r="1.6" fill="#d98a1c" />
        </svg>
      ),
    },
    {
      id: "deposits",
      label: "Input Deposit",
      href: "/dashboard/admin/deposits",
      bg: "bg-[#d9f2e0]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="#1fae70" strokeWidth="1.8" />
          <path d="M3 10H21" stroke="#1fae70" strokeWidth="1.8" />
          <path d="M7 14H10" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "meal-requests",
      label: "Meal Off/On",
      href: "/dashboard/admin/requests/meal-off-on",
      bg: "bg-[#fbdcdc]",
      badge: pendingMealCount > 0 ? String(pendingMealCount) : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="7" width="16" height="12" rx="2" stroke="#e5484d" strokeWidth="1.8" />
          <path d="M8 7V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V7" stroke="#e5484d" strokeWidth="1.8" />
          <text x="12" y="14.5" fontSize="6" fontWeight="700" fill="#e5484d" textAnchor="middle">OFF</text>
        </svg>
      ),
    },
    {
      id: "guest-meals",
      label: "Guest Meal Requests",
      href: "/dashboard/admin/requests/guest-meals",
      bg: "bg-[#fbe4cf]",
      badge: pendingGuestCount > 0 ? String(pendingGuestCount) : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="8.5" cy="8" r="2.5" stroke="#d98a1c" strokeWidth="1.6" />
          <circle cx="15.5" cy="9" r="2" stroke="#d98a1c" strokeWidth="1.6" />
          <path d="M3 19C3 15.5 5.5 13 8.5 13C10 13 11.3 13.6 12.2 14.6" stroke="#d98a1c" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 19C12 16.5 13.5 14.5 15.5 14.5C17.8 14.5 19.5 16.3 19.5 19" stroke="#d98a1c" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "stock",
      label: "Freezer Stock",
      href: "/dashboard/admin/stock",
      bg: "bg-[#d7e7fb]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M6 8H18L17 20H7L6 8Z" stroke="#2f6fed" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 8V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8" stroke="#2f6fed" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "members",
      label: "Assign Bazar Duty",
      href: "/dashboard/admin/assign-bazar",
      bg: "bg-[#ece9fb]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3" stroke="#6a4fd8" strokeWidth="1.8" />
          <path d="M7 20C7 16.7 9.2 14 12 14C14.8 14 17 16.7 17 20" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M9 11L12 14L15 11" stroke="#6a4fd8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "role-management",
      label: "Role Management",
      href: "/dashboard/admin/role-management",
      bg: "bg-[#fadde3]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3" stroke="#e5484d" strokeWidth="1.8" />
          <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#e5484d" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 10L17 12L21 8" stroke="#e5484d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "mess-code",
      label: "Mess Code",
      href: "/dashboard/admin/mess-code",
      bg: "bg-[#dde3f7]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="#3a4fb0" strokeWidth="1.7" />
          <rect x="15" y="3" width="6" height="6" rx="1" stroke="#3a4fb0" strokeWidth="1.7" />
          <rect x="3" y="15" width="6" height="6" rx="1" stroke="#3a4fb0" strokeWidth="1.7" />
          <path d="M15 15H21V21H15V15Z" stroke="#3a4fb0" strokeWidth="1.7" />
        </svg>
      ),
    },
    {
      id: "join-requests",
      label: "Join Requests",
      href: "/dashboard/admin/requests/join",
      bg: "bg-[#ece9fb]",
      badge: pendingJoinCount > 0 ? String(pendingJoinCount) : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="8" r="3" stroke="#6a4fd8" strokeWidth="1.8" />
          <path d="M3 20C3 16.7 5.7 14 9 14C10.5 14 11.9 14.6 12.9 15.5" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 6V12M13 9H19" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "download-log",
      label: "Download Log",
      href: "#",
      bg: "bg-[#ece9fb]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V15M12 15L8 11M12 15L16 11" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V16" stroke="#6a4fd8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-lg font-bold">Admin Dashboard</span>
      </div>

      {/* Stats */}
      <AdminStats
        memberCount={memberCount}
        pendingCount={totalPendingCount}
        contactCount={contactCount}
      />

      {/* Tile Grid */}
      <div className="bg-white rounded-2xl p-4 px-5" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.href === "#" ? "#" : tile.href}
              onClick={(e) => {
                if (tile.href === "#") {
                  e.preventDefault();
                  setDownloadOpen(true);
                }
              }}
            >
              <div
                className="bg-[#f9fafb] rounded-2xl p-4 pb-3.5 flex flex-col items-center gap-2.5 text-center relative cursor-pointer transition-all"
              >
                {tile.badge && (
                  <span className="absolute top-2.5 right-2.5 bg-[#6a4fd8] text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-lg">
                    {tile.badge}
                  </span>
                )}
                <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center ${tile.bg}`}>
                  {tile.icon}
                </div>
                <span className="text-xs font-semibold leading-tight">{tile.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Download Log Dialog */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-w-sm max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Download Log</DialogTitle>
            <DialogDescription>Export mess data as an Excel file.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Period */}
            <div>
              <p className="text-xs font-semibold text-[#666] mb-2">Period</p>
              <div className="flex rounded-full bg-[#f2f1fb] p-1">
                {([
                  { key: "single", label: "Single Month" },
                  { key: "range", label: "Range" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDlPeriod(opt.key)}
                    className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                      dlPeriod === opt.key ? "bg-[#6a4fd8] text-white" : "text-[#6a4fd8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month pickers */}
            {dlPeriod === "single" ? (
              <div>
                <p className="text-xs font-semibold text-[#666] mb-2">Month</p>
                <MonthPickerField label="Month" value={dlMonth} onChange={setDlMonth} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#666] mb-2">From</p>
                  <MonthPickerField label="From" value={dlStart} onChange={setDlStart} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#666] mb-2">To</p>
                  <MonthPickerField label="To" value={dlEnd} onChange={setDlEnd} />
                </div>
              </div>
            )}

            <p className="text-[12px] text-[#8a8a9e]">
              {dlPeriod === "range" && dlStart !== dlEnd
                ? "Multiple months will be downloaded as a ZIP file containing one Excel file per month."
                : "A single Excel file with Summary, Meals, Guest Meals, Deposits, Expenses and Menu sheets will be downloaded."}
            </p>

            <button
              type="button"
              onClick={handleDownloadLog}
              disabled={loading}
              className="w-full text-white rounded-[16px] py-[14px] text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7C6DE8, #6C5DD3)",
                boxShadow: "0 10px 20px rgba(108,93,211,0.35)",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3V15M12 15L8 11M12 15L16 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 16V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
