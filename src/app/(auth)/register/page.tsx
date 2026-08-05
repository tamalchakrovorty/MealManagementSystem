"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify-email">("form");
  const router = useRouter();

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(45);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "verify-email") return;
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setOtpTimer(45);
      setOtp(["", "", "", "", "", ""]);
      setStep("verify-email");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    router.push("/homepage");
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* ======== STEP: Form ======== */}
      {step === "form" && (
        <>
          {/* Title */}
          <div className="text-center">
            <h1 className="text-xl font-bold mb-1.5">Create Your Account</h1>
            <p className="text-[13.5px] text-[#777]">Join your mess community</p>
          </div>

          {/* Illustration */}
          <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <ellipse cx="160" cy="165" rx="90" ry="10" fill="#5a3a20" />
            <rect x="70" y="155" width="180" height="9" fill="#6b4527" />
            <rect x="80" y="164" width="7" height="18" fill="#4a3018" />
            <rect x="233" y="164" width="7" height="18" fill="#4a3018" />
            <ellipse cx="115" cy="158" rx="14" ry="5" fill="#f4f1ea" />
            <ellipse cx="160" cy="160" rx="14" ry="5" fill="#f4f1ea" />
            <ellipse cx="205" cy="158" rx="14" ry="5" fill="#f4f1ea" />
            <circle cx="180" cy="152" r="5" fill="#4a9b8f" />
            <circle cx="140" cy="154" r="4" fill="#e5484d" />
            <rect x="66" y="120" width="9" height="42" fill="#2c2c3a" />
            <rect x="245" y="120" width="9" height="42" fill="#2c2c3a" />
            <circle cx="95" cy="122" r="15" fill="#e8a878" />
            <path d="M80 120C80 110 87 104 95 104C103 104 110 110 110 120" fill="#2a2015" />
            <rect x="79" y="132" width="32" height="32" rx="9" fill="#e0812c" />
            <circle cx="138" cy="115" r="15" fill="#f0b088" />
            <path d="M123 113C123 103 130 97 138 97C146 97 153 103 153 113" fill="#3a2a1e" />
            <rect x="122" y="127" width="32" height="32" rx="9" fill="#5a9270" />
            <circle cx="182" cy="115" r="15" fill="#f0b088" />
            <path d="M167 113C167 103 174 97 182 97C190 97 197 103 197 113" fill="#1a1e3a" />
            <rect x="166" y="127" width="32" height="32" rx="9" fill="#4a7fc9" />
            <circle cx="225" cy="122" r="15" fill="#c98a5c" />
            <path d="M210 120C210 110 217 104 225 104C233 104 240 110 240 120" fill="#1a1410" />
            <rect x="209" y="132" width="32" height="32" rx="9" fill="#5b3fd6" />
          </svg>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Tanvir Ahmed"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-3.5 py-3 text-sm text-[#222] font-semibold placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#5b3fd6] transition-colors"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="e.g. tanvir@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-3.5 py-3 text-sm text-[#222] font-semibold placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#5b3fd6] transition-colors"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 01712-345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-3.5 py-3 text-sm text-[#222] font-semibold placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#5b3fd6] transition-colors"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-3.5 py-3 pr-10 text-sm text-[#222] font-semibold placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#5b3fd6] transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999]">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-[#666] block mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-3.5 py-3 pr-10 text-sm text-[#222] font-semibold placeholder:text-[#aaa] placeholder:font-normal outline-none focus:border-[#5b3fd6] transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999]">
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-[#e5484d] bg-[#e5484d]/10 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5b3fd6] text-white rounded-[14px] py-3.5 text-[15px] font-bold disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-[13px] text-[#555]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#6a4fd8] font-bold">Login</Link>
          </p>
        </>
      )}

      {/* ======== STEP: Verify Email ======== */}
      {step === "verify-email" && (
        <>
          {/* Back button */}
          <div className="pt-0">
            <button type="button" onClick={() => setStep("form")} className="w-10 h-10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15.5L6.5 10L12.5 4.5" stroke="#1B1B23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Title */}
          <div className="text-center px-7">
            <h1 className="text-[21px] font-bold text-[#1B1B23] mb-2.5">Verify Your Email</h1>
            <p className="text-[14px] leading-relaxed text-[#8A8A9E]">
              We have sent a 6-digit OTP to<br />
              <span className="text-[#6C5DD3] font-bold">{email}</span>
            </p>
          </div>

          {/* Envelope Illustration */}
          <div className="flex justify-center py-5">
            <svg width="140" height="140" viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="80" fill="#F1EFFB" />
              <rect x="35" y="52" width="90" height="62" rx="10" fill="#DCD6F5" />
              <rect x="35" y="58" width="90" height="56" rx="10" fill="#FFFFFF" stroke="#C7BFEF" strokeWidth="2" />
              <path d="M37 60L80 90L123 60" stroke="#B9AEEA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="55" y="72" width="30" height="4" rx="2" fill="#C7BFEF" />
              <rect x="55" y="80" width="40" height="4" rx="2" fill="#C7BFEF" />
              <circle cx="112" cy="104" r="18" fill="#3CB878" stroke="#fff" strokeWidth="4" />
              <path d="M103.5 104.5L109 110L121 97" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* OTP Inputs */}
          <div className="px-6">
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
                  className="w-[44px] h-[52px] rounded-xl border-[1.5px] border-[#ECECF4] bg-[#F5F5FA] text-center text-[20px] font-bold text-[#1B1B23] outline-none transition-all focus:border-[#6C5DD3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(108,93,211,0.15)]"
                />
              ))}
            </div>

            <div className="text-center mt-5.5">
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
          <div className="pt-6 px-6">
            <button
              type="button"
              onClick={handleVerify}
              className="w-full bg-[#6C5DD3] text-white rounded-[16px] py-[17px] text-[16px] font-bold transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 10px 20px rgba(108,93,211,0.35)" }}
            >
              Verify
            </button>
          </div>
        </>
      )}
    </div>
  );
}
