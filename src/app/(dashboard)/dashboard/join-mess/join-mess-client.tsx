"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { popup } from "@/lib/popup";

declare global {
  interface Window {
    jsQR?: (data: DataView, width: number, height: number) => { data: string } | null;
  }
}

function extractCodeFromQR(raw: string): string {
  try {
    const url = new URL(raw);
    return url.searchParams.get("code") || raw;
  } catch {
    return raw;
  }
}

export function JoinMessClient() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.toUpperCase() || "");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const router = useRouter();

  const stopScanner = useCallback(() => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScannerOpen(false);
  }, []);

  const tick = useCallback(async () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import("jsqr")).default;
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        const extracted = extractCodeFromQR(result.data).toUpperCase();
        setCode(extracted);
        popup.success("QR code detected: " + extracted);
        setTimeout(stopScanner, 500);
        return;
      }
    } catch {
      // jsQR not available, skip
    }
    animFrameRef.current = requestAnimationFrame(tick);
  }, [scanning, stopScanner]);

  useEffect(() => {
    if (scanning) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [scanning, tick]);

  const startScanner = async () => {
    setCameraError("");
    setScannerOpen(true);

    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      setCameraError("Camera requires HTTPS. Please use the mess code input above, or access the site via HTTPS.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device/browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err: any) {
      setCameraError(err.message || "Camera permission denied");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);

    const res = await fetch("/api/mess/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      popup.error("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);

    if (!res.ok) {
      popup.error(data.error || "Failed to join");
      return;
    }

    popup.success("Join request sent! Waiting for manager approval.");
    router.push("/homepage");
  };

  return (
    <div className="space-y-0 max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <Link href="/homepage" className="p-2 -ml-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 px-6 pb-8 flex flex-col items-center">
        {/* Title */}
        <h1 className="text-xl font-bold text-center mt-1 mb-1.5">Join a Mess</h1>
        <p className="text-[13.5px] text-[#777] text-center leading-relaxed mb-5">
          Enter the mess code shared<br />with you
        </p>

        {/* Illustration */}
        <div className="relative w-full mb-6">
          <svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <ellipse cx="160" cy="145" rx="95" ry="14" fill="#e3e6f0" />
            <circle cx="95" cy="90" r="18" fill="#c98a5c" />
            <path d="M78 88C78 77 85 70 95 70C105 70 112 77 112 88" fill="#1a1410" />
            <rect x="76" y="100" width="38" height="50" rx="12" fill="#5a9270" />
            <circle cx="160" cy="78" r="22" fill="#5b3fd6" />
            <rect x="135" y="95" width="50" height="60" rx="14" fill="#6a4fd8" />
            <circle cx="225" cy="90" r="18" fill="#2a2015" />
            <circle cx="225" cy="93" r="16" fill="#f0b088" />
            <path d="M209 89C209 78 216 71 225 71C234 71 241 78 241 89" fill="#1a1410" />
            <rect x="206" y="103" width="38" height="47" rx="12" fill="#e0a23a" />
          </svg>
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[#5b3fd6] flex items-center justify-center" style={{ boxShadow: "0 3px 8px rgba(91,63,214,0.4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <label className="block text-[12.5px] font-semibold text-[#666] mb-2">Mess Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="e.g. GHM-7X9K"
            className="w-full bg-white border-[1.4px] border-[#e3e0f5] rounded-xl px-4 py-3.5 text-[15px] font-semibold text-[#222] mb-4 outline-none focus:border-[#6a4fd8] transition-colors"
            required
          />

          {/* Divider */}
          <div className="flex items-center gap-2.5 w-full mb-4">
            <div className="flex-1 h-px bg-[#e3e0f5]" />
            <span className="text-xs text-[#999] font-semibold">OR</span>
            <div className="flex-1 h-px bg-[#e3e0f5]" />
          </div>

          {/* Scan QR */}
          <button
            type="button"
            onClick={startScanner}
            className="w-full bg-white text-[#5b3fd6] border-[1.6px] border-[#d9d3f7] rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2.5 mb-4"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M4 8V5C4 4.44772 4.44772 4 5 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 4H19C19.5523 4 20 4.44772 20 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 16V19C20 19.5523 19.5523 20 19 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 20H5C4.44772 20 4 19.5523 4 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
            Scan QR Code
          </button>

          {/* Info box */}
          <div className="bg-[#ece9fb] rounded-[14px] p-3.5 flex items-start gap-3 w-full mb-6">
            <div className="w-5 h-5 rounded-full bg-[#5b3fd6] flex items-center justify-center shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 11V17" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1.3" fill="#fff" />
              </svg>
            </div>
            <p className="text-[13px] text-[#444] leading-relaxed font-medium">
              Ask your manager for the mess code.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-[#5b3fd6] text-white rounded-[14px] py-4 text-[15.5px] font-bold disabled:opacity-50 mb-4"
          >
            {loading ? "Sending request..." : "Submit Request"}
          </button>
        </form>

        {/* Back */}
        <Link href="/homepage" className="text-sm font-bold text-[#6a4fd8]">
          Back to Dashboard
        </Link>
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col rounded-none">
          {/* Scanner Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-3.5 z-10">
            <span className="text-white text-base font-bold">Scan Mess QR Code</span>
            <button
              onClick={stopScanner}
              className="w-[34px] h-[34px] rounded-full bg-white/15 flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M6 18L18 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Video */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan Frame */}
            <div className="relative z-10 w-[220px] h-[220px]">
              <div className="absolute top-0 left-0 w-[34px] h-[34px] border-[3.5px] border-[#5b3fd6] border-r-0 border-b-0 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-[34px] h-[34px] border-[3.5px] border-[#5b3fd6] border-l-0 border-b-0 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-[34px] h-[34px] border-[3.5px] border-[#5b3fd6] border-r-0 border-t-0 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-[34px] h-[34px] border-[3.5px] border-[#5b3fd6] border-l-0 border-t-0 rounded-br-lg" />
              <div
                className="absolute left-1.5 right-1.5 h-0.5 bg-[#5b3fd6]"
                style={{
                  boxShadow: "0 0 8px 1px #5b3fd6",
                  animation: "scanmove 2.2s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          {/* Scanner Status / Hint */}
          {cameraError ? (
            <p className="text-center text-white text-sm py-2 px-6">{cameraError}</p>
          ) : null}
          <p className="text-center text-white/85 text-[13px] font-medium py-4 px-12 pb-12">
            Point your camera at the mess QR code<br />to join automatically
          </p>
        </div>
      )}

      {/* Scan line animation */}
      <style jsx global>{`
        @keyframes scanmove {
          0% { top: 6px; }
          50% { top: 210px; }
          100% { top: 6px; }
        }
      `}</style>
    </div>
  );
}
