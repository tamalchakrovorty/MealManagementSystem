"use client";

import Link from "next/link";

interface AdminStatsProps {
  memberCount: number;
  pendingCount: number;
  contactCount: number;
}

export function AdminStats({ memberCount, pendingCount, contactCount }: AdminStatsProps) {
  return (
    <div className="bg-white rounded-2xl p-4 px-5" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
      <div className="grid grid-cols-3 gap-3">
        <Link href="/dashboard/admin/members">
          <div className="bg-[#f9fafb] rounded-2xl p-4 text-center cursor-pointer hover:bg-[#f0f0f5] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#d7f2e9] flex items-center justify-center mx-auto mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="#1fae70" strokeWidth="1.8"/><path d="M7 20C7 16.7 9.2 14 12 14C14.8 14 17 16.7 17 20" stroke="#1fae70" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <div className="text-xl font-bold">{memberCount}</div>
            <div className="text-[11px] text-[#999] font-semibold">Members</div>
          </div>
        </Link>
        <Link href="/dashboard/admin/pending">
          <div className="bg-[#f9fafb] rounded-2xl p-4 text-center cursor-pointer hover:bg-[#f0f0f5] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#fbe9c9] flex items-center justify-center mx-auto mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#d98a1c" strokeWidth="1.8"/><path d="M12 8v4l3 3" stroke="#d98a1c" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <div className="text-xl font-bold">{pendingCount}</div>
            <div className="text-[11px] text-[#999] font-semibold">Pending</div>
          </div>
        </Link>
        <Link href="/dashboard/admin/contacts">
          <div className="bg-[#f9fafb] rounded-2xl p-4 text-center cursor-pointer hover:bg-[#f0f0f5] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#dde3f7] flex items-center justify-center mx-auto mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="#3a4fb0" strokeWidth="1.8"/><path d="M9 10H15M9 14H13" stroke="#3a4fb0" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div className="text-xl font-bold">{contactCount}</div>
            <div className="text-[11px] text-[#999] font-semibold">Contacts</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
