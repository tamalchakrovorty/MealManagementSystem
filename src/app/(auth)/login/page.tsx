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
        {/* Email / Phone */}
        <div className="bg-white rounded-[14px] px-4 py-3.5 flex items-center gap-3" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <span className="text-[#999] shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Email or Phone Number"
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

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e0e0e0]" />
        <span className="text-[12.5px] text-[#999]">or</span>
        <div className="flex-1 h-px bg-[#e0e0e0]" />
      </div>

      {/* Google Login */}
      <button
        onClick={() => {
          const redirectUri = `${window.location.origin}/api/auth/google/callback`;
          const params = new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
          });
          window.location.href = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
        }}
        className="w-full flex items-center justify-center gap-3 bg-white border-[1.5px] border-[#e0e0e0] rounded-[14px] py-3.5 text-[14.5px] font-semibold text-[#333] hover:bg-[#f8f8f8] transition-colors cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Register */}
      <p className="text-center text-[13.5px] text-[#555]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#6a4fd8] font-bold">Register</Link>
      </p>
    </div>
  );
}
