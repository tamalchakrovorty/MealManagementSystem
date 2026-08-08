"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function FindAccountPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"search" | "found" | "verified" | "done">("search");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // User data from API
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userMess, setUserMess] = useState("");

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(45);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password strength
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const pwScore = getPasswordStrength(newPassword);
  const pwLabel = pwScore <= 1 ? "Weak" : pwScore === 2 ? "Fair" : pwScore === 3 ? "Good" : "Strong";
  const pwColor = pwScore <= 1 ? "#e5484d" : pwScore === 2 ? "#d98a1c" : "#3CB878";
  const pwWidth = `${(pwScore / 4) * 100}%`;
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const allRequirementsMet = hasMinLen && hasUpper && hasNumber && hasSpecial;
  const canSubmit = allRequirementsMet && newPassword === confirmPassword && confirmPassword.length > 0;

  // OTP countdown timer
  useEffect(() => {
    if (step !== "found") return;
    if (otpTimer <= 0) return;
    const timer = setInterval(() => {
      setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleResend = () => {
    setOtpTimer(45);
    setOtp(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please enter email or phone number");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/find-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setUserName(data.name);
    setUserEmail(data.email || "");
    setUserPhone(data.phone || "");
    setUserAvatar(data.avatarUrl || "");
    setUserMess(data.messName || "");
    setOtpTimer(45);
    setOtp(["", "", "", "", "", ""]);
    setStep("found");
    setLoading(false);
  };

  const handleVerifyOtp = () => {
    setStep("verified");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/user/find-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    setStep("done");
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        {(step === "search" || step === "found") && (
          <Link
            href="/login"
            className="w-9 h-9 flex items-center justify-center bg-[#F7F7FB] rounded-xl shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15.5L6.5 10L12.5 4.5" stroke="#1B1B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        {step === "verified" && (
          <button
            type="button"
            onClick={() => { setStep("found"); setError(""); setNewPassword(""); setConfirmPassword(""); }}
            className="shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15.5L6.5 10L12.5 4.5" stroke="#1B1B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className="text-[20px] font-bold text-[#1B1B23]">
          {step === "search" && "Find Your Account"}
          {step === "found" && "Account Found"}
          {step === "verified" && "Set New Password"}
          {step === "done" && "Done"}
        </h1>
      </div>

      {/* Illustration — search step: magnifying glass; found step: person with checkmark */}
      {step === "search" && (
        <div className="flex justify-center py-2">
          <svg width="140" height="140" viewBox="-10 -10 220 220" fill="none">
            <circle cx="85" cy="85" r="95" fill="#F5F4FC" />
            <circle cx="85" cy="85" r="54" fill="#FFFFFF" stroke="#C7CFE6" strokeWidth="9" />
            <circle cx="85" cy="85" r="30" fill="#EEEBFA" />
            <circle cx="85" cy="70" r="12" fill="#4F7CFF" />
            <path d="M64 104C64 92.5 73 84 85 84C97 84 106 92.5 106 104" stroke="#4F7CFF" strokeWidth="9" strokeLinecap="round" fill="none" />
            <rect x="77" y="132" width="17" height="72" rx="8.5" fill="#2E3958" transform="rotate(45 85 85)" />
          </svg>
        </div>
      )}

      {step === "found" && (
        <div className="flex justify-center py-2">
          <svg width="120" height="120" viewBox="0 0 140 140" fill="none">
            <path d="M20 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#D8D2F5" />
            <path d="M118 50l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#D8D2F5" />
            <path d="M15 85l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#D8D2F5" />
            <path d="M108 95l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#D8D2F5" />
            <circle cx="70" cy="68" r="46" fill="#EDEBFA" />
            <circle cx="70" cy="55" r="15" fill="#6C5DD3" />
            <path d="M45 96C45 79 56 68 70 68C84 68 95 79 95 96" fill="#8577E0" />
            <circle cx="98" cy="94" r="15" fill="#3CB878" stroke="#fff" strokeWidth="3" />
            <path d="M91 94l4.5 4.5L106 88" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Step: Search */}
      {step === "search" && (
        <>
          <div className="text-center">
            <h2 className="text-[22px] font-bold mb-1.5 text-[#1B1B23]">Find Your Account</h2>
            <p className="text-sm text-[#8A8A9E]">Enter your registered email or phone number</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3.5">
            <div>
              <label className="block text-[13px] font-semibold text-[#222] mb-2">Email Address</label>
              <div className="bg-[#F7F7FB] border-[1.5px] border-[#ECECF4] rounded-[14px] px-3.5 py-3 flex items-center gap-2.5 focus-within:border-[#6C5DD3] focus-within:bg-white transition-all">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-[#8A8A9E] shrink-0">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 5.5L10 11L17 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[15px] text-[#1B1B23] placeholder:text-[#B3B3C2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#222] mb-2">Phone Number</label>
              <div className="bg-[#F7F7FB] border-[1.5px] border-[#ECECF4] rounded-[14px] px-3.5 py-3 flex items-center gap-2.5 focus-within:border-[#6C5DD3] focus-within:bg-white transition-all">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-[#8A8A9E] shrink-0">
                  <path d="M6.5 3H4.8C4.1 3 3.5 3.6 3.5 4.3C3.5 11.6 9.4 17.5 16.7 17.5C17.4 17.5 18 16.9 18 16.2V14.5L14.5 12.5L13 14C11 13 9 11 8 9L9.5 7.5L7.5 4L6.5 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[15px] text-[#1B1B23] placeholder:text-[#B3B3C2]"
                />
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-[#e5484d] bg-[#e5484d]/10 px-3 py-2 rounded-lg">{error}</p>
                <button type="button" onClick={() => setError("")}
                  className="w-full text-[14px] text-[#6C5DD3] font-semibold py-2">
                  Search Again
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6C5DD3] text-white rounded-[16px] py-[17px] text-[16px] font-semibold disabled:opacity-60 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 10px 20px rgba(108,93,211,0.35)" }}
            >
              {loading ? "Searching..." : "Search Account"}
            </button>

            <Link href="/login" className="block text-center text-[15px] text-[#6C5DD3] font-semibold mt-4">
              Back to Login
            </Link>
          </form>
        </>
      )}

      {/* Step: Found — Profile card + OTP */}
      {step === "found" && (
        <>
          <div className="text-center">
            <h2 className="text-[19px] font-bold text-[#1B1B23] mb-1">We found your account!</h2>
            <p className="text-[13.5px] text-[#8A8A9E]">Please verify your identity to reset your password.</p>
          </div>

          {/* Profile Card */}
          <div className="bg-[#F7F7FB] rounded-[18px] p-[18px] flex gap-3.5">
            <div className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: "linear-gradient(160deg, #C9BFF0, #6C5DD3)" }}>
              {userAvatar ? (
                <Image src={userAvatar} alt={userName} width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 40 40" fill="none" width="38" height="38">
                  <circle cx="20" cy="15" r="7" fill="#fff" fillOpacity="0.9" />
                  <path d="M6 36C6 26 12 21 20 21C28 21 34 26 34 36" fill="#fff" fillOpacity="0.9" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-[16.5px] font-bold text-[#1B1B23]">{userName}</h3>
                <span className="bg-[#EDEBFA] text-[#6C5DD3] text-[11px] font-bold px-2.5 py-[3px] rounded-full">
                  Member
                </span>
              </div>
              {userMess && (
                <div className="flex items-center gap-1.5 text-[#6C5DD3] text-[13px] font-semibold mb-2.5">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="14" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2.5 16.5C2.5 12.5 4.5 11 7 11C9.5 11 11.5 12.5 11.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12.5 12.2C14.7 12.5 16 13.7 16 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {userMess}
                </div>
              )}
              <div className="h-px bg-[#ECECF4] mb-2.5" />
              <div className="flex items-center gap-2 text-[13.5px] text-[#1B1B23] mb-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-[#6C5DD3] shrink-0">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 5.5L10 11L17 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {userEmail}
              </div>
              {userPhone && (
                <div className="flex items-center gap-2 text-[13.5px] text-[#1B1B23]">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-[#6C5DD3] shrink-0">
                    <path d="M6.5 3H4.8C4.1 3 3.5 3.6 3.5 4.3C3.5 11.6 9.4 17.5 16.7 17.5C17.4 17.5 18 16.9 18 16.2V14.5L14.5 12.5L13 14C11 13 9 11 8 9L9.5 7.5L7.5 4L6.5 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                  {userPhone}
                </div>
              )}
            </div>
          </div>

          {/* OTP Section */}
          <div className="bg-[#F7F7FB] rounded-[18px] p-5">
            <p className="text-[16px] font-bold text-[#1B1B23] mb-4">Enter OTP</p>
            <div className="flex gap-2.5 justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="w-[44px] h-[52px] rounded-xl border-[1.5px] border-[#ECECF4] bg-white text-center text-[20px] font-semibold text-[#1B1B23] outline-none transition-all focus:border-[#6C5DD3] focus:shadow-[0_0_0_3px_rgba(108,93,211,0.15)]"
                />
              ))}
            </div>
            <div className="text-center mt-5">
              <p className="text-[13px] text-[#8A8A9E] mb-1">Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={otpTimer > 0}
                className="text-[14px] font-bold text-[#6C5DD3] disabled:text-[#8A8A9E] disabled:font-semibold"
              >
                {otpTimer > 0 ? `Resend OTP (00:${otpTimer.toString().padStart(2, "0")})` : "Resend OTP"}
              </button>
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            className="w-full text-white rounded-[16px] py-[17px] text-[16px] font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #7C6DE8, #6C5DD3)",
              boxShadow: "0 10px 20px rgba(108,93,211,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L16.5 4.5V9.5C16.5 13.5 13.7 17 10 18C6.3 17 3.5 13.5 3.5 9.5V4.5L10 2Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 10L9 12L13 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Verify OTP
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-[#ECECF4]" />
            <span className="text-[12.5px] text-[#8A8A9E]">or</span>
            <span className="flex-1 h-px bg-[#ECECF4]" />
          </div>

          {/* No, not my account */}
          <button
            type="button"
            onClick={() => { setStep("search"); setError(""); setOtp(["", "", "", "", "", ""]); }}
            className="w-full bg-[#EDEBFA] border-none rounded-[14px] py-[15px] text-[14.5px] font-bold text-[#6C5DD3] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15.5L6.5 10L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            No, this is not my account
          </button>
        </>
      )}

      {/* Step: Verified — Set New Password */}
      {step === "verified" && (
        <>
          <p className="text-[14px] leading-[1.4] text-[#8A8A9E] -mt-2">
            Create a new password for your account
          </p>

          <div className="space-y-5 pt-3">
            {/* New Password */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1B1B23] mb-2">New Password</label>
              <div className="bg-[#F5F5FA] border-[1.5px] border-[#ECECF4] rounded-[24px] px-4 py-3.5 flex items-center gap-2.5 focus-within:border-[#6C5DD3] focus-within:bg-white transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[17px] text-[#1B1B23] placeholder:text-[#B3B3C2] placeholder:text-[15px] placeholder:tracking-normal"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#8A8A9E] shrink-0">
                  {showPassword ? (
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
              {/* Strength meter */}
              {newPassword.length > 0 && (
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="flex-1 h-[5px] bg-[#ECECF4] rounded-[3px] overflow-hidden">
                    <div className="h-full rounded-[3px] transition-all duration-300" style={{ width: pwWidth, background: pwColor }} />
                  </div>
                  <span className="text-[12px] font-semibold shrink-0" style={{ color: pwColor }}>{pwLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1B1B23] mb-2">Confirm New Password</label>
              <div className="bg-[#F5F5FA] border-[1.5px] border-[#ECECF4] rounded-[24px] px-4 py-3.5 flex items-center gap-2.5 focus-within:border-[#6C5DD3] focus-within:bg-white transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[17px] text-[#1B1B23] placeholder:text-[#B3B3C2] placeholder:text-[15px] placeholder:tracking-normal"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#8A8A9E] shrink-0">
                  {showPassword ? (
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

            {/* Requirements card */}
            <div className="bg-[#F5F5FA] rounded-[16px] p-4">
              <p className="text-[13px] font-semibold text-[#1B1B23] mb-2.5">Password must contain:</p>
              <ul className="space-y-2">
                {[
                  { label: "At least 8 characters", met: hasMinLen },
                  { label: "One uppercase letter", met: hasUpper },
                  { label: "One number", met: hasNumber },
                  { label: "One special character", met: hasSpecial },
                ].map((req) => (
                  <li key={req.label} className="flex items-center gap-2 text-[13px] text-[#1B1B23]">
                    {req.met ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <circle cx="8" cy="8" r="8" fill="#3CB878" />
                        <path d="M4.5 8.2L6.8 10.5L11.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

            {error && (
              <p className="text-sm text-[#e5484d] bg-[#e5484d]/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleReset}
              disabled={!canSubmit || loading}
              className="w-full bg-[#6C5DD3] text-white rounded-[16px] py-[17px] text-[16px] font-semibold disabled:opacity-60 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 10px 20px rgba(108,93,211,0.35)" }}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

            {/* Back to Login */}
            <Link href="/login" className="block w-full text-center text-[15px] text-[#6C5DD3] font-semibold">
              Back to Login
            </Link>
          </div>
        </>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="text-center space-y-4">
          <div className="bg-[#d9f2e0] rounded-2xl p-5">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3">
              <circle cx="12" cy="12" r="10" stroke="#1fae70" strokeWidth="2" />
              <path d="M8 12L11 15L16 9" stroke="#1fae70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[15px] font-bold text-[#1a6b40]">Password Reset Successful!</p>
            <p className="text-sm text-[#3a8a5a] mt-1">You can now login with your new password.</p>
          </div>

          <Link
            href="/login"
            className="block w-full bg-[#6C5DD3] text-white rounded-[16px] py-[17px] text-[16px] font-semibold text-center"
            style={{ boxShadow: "0 10px 20px rgba(108,93,211,0.35)" }}
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}
