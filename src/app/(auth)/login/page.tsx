"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push("/homepage");
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-[22px] font-bold mb-1.5">Welcome Back!</h1>
        <p className="text-sm text-[#777]">Sign in to continue</p>
      </div>

      {/* Illustration */}
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full">
        <polygon points="160,20 260,80 60,80" fill="#3f5478" />
        <rect x="75" y="80" width="170" height="120" fill="#c9d4e6" />
        <rect x="145" y="95" width="30" height="30" fill="#f2f5fa" stroke="#3f5478" strokeWidth="2" />
        <line x1="160" y1="95" x2="160" y2="125" stroke="#3f5478" strokeWidth="2" />
        <line x1="145" y1="110" x2="175" y2="110" stroke="#3f5478" strokeWidth="2" />
        <rect x="90" y="130" width="34" height="55" fill="#e7edf5" stroke="#3f5478" strokeWidth="2" />
        <rect x="196" y="130" width="34" height="55" fill="#e7edf5" stroke="#3f5478" strokeWidth="2" />
        <ellipse cx="160" cy="195" rx="95" ry="12" fill="#7a5230" />
        <rect x="65" y="185" width="190" height="10" fill="#8a5f3b" />
        <rect x="75" y="195" width="8" height="20" fill="#6b4527" />
        <rect x="237" y="195" width="8" height="20" fill="#6b4527" />
        <ellipse cx="120" cy="188" rx="16" ry="6" fill="#f4f1ea" />
        <ellipse cx="160" cy="190" rx="16" ry="6" fill="#f4f1ea" />
        <ellipse cx="200" cy="188" rx="16" ry="6" fill="#f4f1ea" />
        <circle cx="140" cy="182" r="6" fill="#d98a1c" />
        <circle cx="180" cy="184" r="5" fill="#e5484d" />
        <rect x="62" y="150" width="10" height="45" fill="#2c2c3a" />
        <rect x="248" y="150" width="10" height="45" fill="#2c2c3a" />
        <circle cx="95" cy="150" r="16" fill="#f0b088" />
        <path d="M79 148C79 138 86 132 95 132C104 132 111 138 111 148" fill="#3a2a1e" />
        <rect x="78" y="160" width="34" height="35" rx="10" fill="#d85a4a" />
        <circle cx="140" cy="145" r="16" fill="#f0b088" />
        <path d="M124 143C124 133 131 127 140 127C149 127 156 133 156 143" fill="#2a2015" />
        <rect x="123" y="155" width="34" height="35" rx="10" fill="#5a9270" />
        <circle cx="185" cy="145" r="16" fill="#f0b088" />
        <path d="M169 143C169 133 176 127 185 127C194 127 201 133 201 143" fill="#3a2a1e" />
        <rect x="168" y="155" width="34" height="35" rx="10" fill="#4a7fc9" />
        <circle cx="228" cy="150" r="16" fill="#e8a878" />
        <path d="M215 143C215 136 220 132 228 132C236 132 241 136 241 143" fill="#2a2015" />
        <rect x="211" y="160" width="34" height="35" rx="10" fill="#e8a23a" />
      </svg>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-3.5">
        {/* Email */}
        <div className="bg-white rounded-[14px] px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <span className="text-[#999] shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14.5px] text-[#222] placeholder:text-[#aaa]"
            required
          />
        </div>

        {/* Password */}
        <div className="bg-white rounded-[14px] px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <span className="text-[#999] shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8V11" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14.5px] text-[#222] placeholder:text-[#aaa]"
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#999] shrink-0">
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

        {/* Error */}
        {error && (
          <p className="text-sm text-[#e5484d] bg-[#e5484d]/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13.5px] text-[#444] cursor-pointer">
            <div
              onClick={() => setRemember(!remember)}
              className={`w-[18px] h-[18px] rounded border-[1.6px] flex items-center justify-center cursor-pointer transition-colors ${
                remember ? "bg-[#6a4fd8] border-[#6a4fd8]" : "border-[#ccc]"
              }`}
            >
              {remember && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            Remember me
          </label>
          <Link href="/find-account" className="text-[13.5px] text-[#6a4fd8] font-semibold">
            Forgot Password?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#5b3fd6] text-white rounded-[14px] py-4 text-[15.5px] font-bold disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      {/* Register */}
      <p className="text-center text-[13.5px] text-[#555]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#6a4fd8] font-bold">Register</Link>
      </p>
    </div>
  );
}
