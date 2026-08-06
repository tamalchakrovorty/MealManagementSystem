"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { popup } from "@/lib/popup";
import { MealOffToggle } from "./meal-off-toggle";
import { MonthPickerField } from "./month-picker-field";
import { Settings, User, Lock, Download, LogOut } from "lucide-react";

export function UserActions({ profile, messId }: { profile: any; messId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [mealOffOpen, setMealOffOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [preview, setPreview] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Download Log state
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [dlScope, setDlScope] = useState<"my" | "full">("my");
  const [dlPeriod, setDlPeriod] = useState<"single" | "range">("single");
  const [dlMonth, setDlMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [dlStart, setDlStart] = useState(() => format(new Date(), "yyyy-MM"));
  const [dlEnd, setDlEnd] = useState(() => format(new Date(), "yyyy-MM"));

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[^A-Za-z0-9]/.test(newPassword) || /[0-9]/.test(newPassword);
  const allRequirementsMet = hasMinLen && hasUpper && hasLower && hasNumberOrSymbol;
  const pwScore = [hasMinLen, hasUpper, hasLower, hasNumberOrSymbol].filter(Boolean).length;
  const pwLabel = pwScore <= 1 ? "Weak" : pwScore === 2 ? "Fair" : pwScore === 3 ? "Good" : "Strong";
  const pwColor = pwScore <= 1 ? "#e5484d" : pwScore === 2 ? "#d98a1c" : "#3CB878";
  const canChange = allRequirementsMet && currentPassword.length > 0 && newPassword === confirmNew && confirmNew.length > 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      popup.error("Image must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      popup.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        popup.error(data.error);
        setPreview(avatarUrl);
      } else {
        setAvatarUrl(data.url);
        popup.success("Avatar uploaded");
      }
    } catch {
      popup.error("Upload failed");
      setPreview(avatarUrl);
    }
    setUploading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/user/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, avatar_url: avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) { popup.error(data.error); }
    else { popup.success("Profile updated"); setEditOpen(false); router.refresh(); }
    setLoading(false);
  };

  const handleLeaveMess = async () => {
    if (!confirm("Are you sure you want to leave this mess?")) return;
    setLoading(true);
    const res = await fetch("/api/user/leave-mess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messId }),
    });
    const data = await res.json();
    if (!res.ok) { popup.error(data.error); }
    else { popup.success(data.message || "You have left the mess"); router.refresh(); }
    setLoading(false);
  };

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
        `/api/user/download-log?messId=${messId}&scope=${dlScope}&start=${start}&end=${end}`
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

  const handleChangePassword = async () => {
    if (!canChange) return;
    setLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      popup.error(data.error);
    } else {
      popup.success("Password changed successfully");
      setChangeOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNew("");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Update Profile Dialog (opened from Settings) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Update your avatar, name, and phone number.</DialogDescription>
          </DialogHeader>

          {/* Avatar Picker */}
          <div className="flex justify-center mb-2">
            <button type="button" onClick={handleAvatarClick} className="relative group">
              {preview ? (
                <img src={preview} alt="Avatar" className="w-20 h-20 rounded-full object-cover bg-[#ddd]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#6a4fd8] flex items-center justify-center text-2xl font-bold text-white">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="1.8" />
                </svg>
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#666] mb-1.5">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full border border-[#e3e0f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666] mb-1.5">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-[#e3e0f5] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6a4fd8] transition-colors" />
            </div>
            <button type="submit" disabled={loading || uploading}
              className="w-full bg-[#5b3fd6] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog (opened from Settings) */}
      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {/* Illustration */}
          <div className="flex justify-center pt-5 pb-1">
            <svg width="100" height="100" viewBox="0 0 150 150" fill="none">
              <path d="M22 60l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#D8D2F5" />
              <line x1="18" y1="92" x2="34" y2="92" stroke="#D8D2F5" strokeWidth="3" strokeLinecap="round" />
              <line x1="112" y1="52" x2="130" y2="52" stroke="#D8D2F5" strokeWidth="3" strokeLinecap="round" />
              <circle cx="75" cy="70" r="48" fill="#F1EFFB" />
              <rect x="55" y="66" width="42" height="36" rx="10" fill="url(#lockGrad)" />
              <path d="M62 66V54C62 44.5 68.5 38 76 38C83.5 38 90 44.5 90 54V66" stroke="url(#lockGrad)" strokeWidth="7" fill="none" strokeLinecap="round" />
              <circle cx="76" cy="82" r="5.5" fill="#fff" />
              <rect x="73.5" y="85" width="5" height="9" rx="2.5" fill="#fff" />
              <circle cx="106" cy="98" r="6" fill="none" stroke="#B7ACE8" strokeWidth="3.5" />
              <line x1="111" y1="98" x2="126" y2="98" stroke="#B7ACE8" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="121" y1="98" x2="121" y2="104" stroke="#B7ACE8" strokeWidth="3.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="lockGrad" x1="55" y1="38" x2="97" y2="102" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B7CEA" />
                  <stop offset="1" stopColor="#5B4BC4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="text-center px-5 mb-4">
            <h2 className="text-[19px] font-bold text-[#1B1B23] mb-1">Create a new password</h2>
            <p className="text-[13.5px] text-[#8A8A9E]">Choose a strong password to keep your account secure.</p>
          </div>

          <div className="px-5 space-y-3 pb-5">
            {/* Current Password */}
            <div className="bg-[#F7F7FB] rounded-[18px] p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6.5 9V6.5C6.5 4.6 8 3 10 3C12 3 13.5 4.6 13.5 6.5V9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-[#1B1B23] mb-2">Current Password</p>
                <div className="flex items-center justify-between">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[15px] text-[#1B1B23] placeholder:text-[#B3B3C2] pr-2"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-[#8A8A9E] shrink-0">
                    {showCurrent ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="bg-[#F7F7FB] rounded-[18px] p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6.5 9V6.5C6.5 4.6 8 3 10 3C12 3 13.5 4.6 13.5 6.5V9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13.5px] font-semibold text-[#1B1B23]">New Password</p>
                  <button type="button" onClick={() => setShowNew(!showNew)} className="text-[#8A8A9E] shrink-0">
                    {showNew ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] text-[#1B1B23] placeholder:text-[#B3B3C2] mb-2"
                />
                {newPassword.length > 0 && (
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="flex-1 h-[5px] bg-[#ECECF4] rounded-[3px] overflow-hidden">
                      <div className="h-full rounded-[3px] transition-all duration-300" style={{ width: `${(pwScore / 4) * 100}%`, background: pwColor }} />
                    </div>
                    <span className="text-[12px] font-bold shrink-0" style={{ color: pwColor }}>{pwLabel}</span>
                  </div>
                )}
                {newPassword.length > 0 && (
                  <p className="text-[12px] text-[#8A8A9E] mt-2 leading-snug">Use 8+ characters with a mix of letters, numbers and symbols.</p>
                )}
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="bg-[#F7F7FB] rounded-[18px] p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6.5 9V6.5C6.5 4.6 8 3 10 3C12 3 13.5 4.6 13.5 6.5V9" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13.5px] font-semibold text-[#1B1B23]">Confirm New Password</p>
                  <button type="button" onClick={() => setShowConfirmNew(!showConfirmNew)} className="text-[#8A8A9E] shrink-0">
                    {showConfirmNew ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                <input
                  type={showConfirmNew ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] text-[#1B1B23] placeholder:text-[#B3B3C2]"
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-[#F7F7FB] rounded-[18px] p-4">
              <p className="text-[14px] font-bold text-[#1B1B23] mb-2.5">Password must contain:</p>
              <ul className="space-y-2.5">
                {[
                  { label: "At least 8 characters", met: hasMinLen },
                  { label: "One uppercase letter", met: hasUpper },
                  { label: "One lowercase letter", met: hasLower },
                  { label: "One number or symbol", met: hasNumberOrSymbol },
                ].map((req) => (
                  <li key={req.label} className="flex items-center gap-2 text-[13px] text-[#1B1B23]">
                    {req.met ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M2 8.5L6 12.5L14 3.5" stroke="#3CB878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <circle cx="8" cy="8" r="7.5" stroke="#ECECF4" />
                      </svg>
                    )}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Update Button */}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={!canChange || loading}
              className="w-full text-white rounded-[16px] py-[16px] text-[16px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #7C6DE8, #6C5DD3)",
                boxShadow: "0 10px 20px rgba(108,93,211,0.35)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L16.5 4.5V9.5C16.5 13.5 13.7 17 10 18C6.3 17 3.5 13.5 3.5 9.5V4.5L10 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 10L9 12L13 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? "Updating..." : "Update Password"}
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={() => {
                setChangeOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNew("");
              }}
              className="block w-full text-center text-[15px] font-bold text-[#6C5DD3] pb-1"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Log Dialog (opened from Settings) */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-w-sm max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Download Log</DialogTitle>
            <DialogDescription>Export mess data as an Excel file.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scope */}
            <div>
              <p className="text-xs font-semibold text-[#666] mb-2">Data</p>
              <div className="flex rounded-full bg-[#f2f1fb] p-1">
                {([
                  { key: "my", label: "My Log" },
                  { key: "full", label: "Full Mess Log" },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDlScope(opt.key)}
                    className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                      dlScope === opt.key ? "bg-[#6a4fd8] text-white" : "text-[#6a4fd8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your account and preferences.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Update Profile */}
            <button
              onClick={() => { setSettingsOpen(false); setEditOpen(true); }}
              className="w-full bg-[#F7F7FB] rounded-[18px] p-4 flex items-center gap-3.5 text-left hover:bg-[#EDEBFA] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <User size={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1B1B23]">Update Profile</p>
                <p className="text-[12px] text-[#8A8A9E]">Change your avatar, name, and phone</p>
              </div>
            </button>

            {/* Change Password */}
            <button
              onClick={() => { setSettingsOpen(false); setChangeOpen(true); }}
              className="w-full bg-[#F7F7FB] rounded-[18px] p-4 flex items-center gap-3.5 text-left hover:bg-[#EDEBFA] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1B1B23]">Change Password</p>
                <p className="text-[12px] text-[#8A8A9E]">Update your account password</p>
              </div>
            </button>

            {/* Download Log */}
            <button
              onClick={() => { setSettingsOpen(false); setDownloadOpen(true); }}
              className="w-full bg-[#F7F7FB] rounded-[18px] p-4 flex items-center gap-3.5 text-left hover:bg-[#EDEBFA] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <Download size={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1B1B23]">Download Log</p>
                <p className="text-[12px] text-[#8A8A9E]">Export mess data as Excel</p>
              </div>
            </button>

            {/* Leave Mess */}
            <button
              onClick={() => { setSettingsOpen(false); handleLeaveMess(); }}
              className="w-full bg-[#F7F7FB] rounded-[18px] p-4 flex items-center gap-3.5 text-left hover:bg-[#EDEBFA] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#EDEBFA] flex items-center justify-center shrink-0 text-[#6C5DD3]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 8V12L14.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1B1B23]">Leave Mess</p>
                <p className="text-[12px] text-[#8A8A9E]">Exit the current mess</p>
              </div>
            </button>

            {/* Log Out */}
            <button
              onClick={async () => {
                setSettingsOpen(false);
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="w-full bg-[#FFF0F0] rounded-[18px] p-4 flex items-center gap-3.5 text-left hover:bg-[#FFE5E5] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#FFD4D4] flex items-center justify-center shrink-0 text-[#E5484D]">
                <LogOut size={18} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#E5484D]">Log Out</p>
                <p className="text-[12px] text-[#E5484D]/70">Sign out of your account</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Section */}
      <div className="space-y-3">
        <p className="text-[12px] md:text-[13px] font-semibold text-[#8b8fa3] uppercase tracking-wide px-1">Quick Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Request Guest Meal */}
          <Link
            href="/dashboard/user/guest-meal"
            className="bg-white rounded-[18px] p-4 flex items-center gap-3.5 w-full text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300"
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center text-[#6a4fd8]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[14.5px] md:text-[15px] font-semibold">Request Guest Meal</span>
          </Link>

          {/* Meal On/Off */}
          <Dialog open={mealOffOpen} onOpenChange={setMealOffOpen}>
            <DialogTrigger
              render={
                <button className="bg-white rounded-[18px] p-4 flex items-center gap-3.5 w-full text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300">
                  <div className="w-[22px] h-[22px] flex items-center justify-center text-[#6a4fd8]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M12 8V12L14.5 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M16 3L20 7L16 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[14.5px] md:text-[15px] font-semibold">Meal On / Off</span>
                </button>
              }
            />
            <DialogContent className="max-w-sm md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Meal On / Off</DialogTitle>
                <DialogDescription>Set your meal status for today or another date.</DialogDescription>
              </DialogHeader>
              <MealOffToggle messId={messId} />
            </DialogContent>
          </Dialog>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="bg-white rounded-[18px] p-4 flex items-center gap-3.5 w-full text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] md:hover:-translate-y-[3px] md:transition-all md:duration-300"
          >
            <div className="w-[22px] h-[22px] flex items-center justify-center text-[#6a4fd8]">
              <Settings size={20} />
            </div>
            <span className="text-[14.5px] md:text-[15px] font-semibold">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
