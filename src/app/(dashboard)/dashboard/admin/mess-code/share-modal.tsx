"use client";

import { popup } from "@/lib/popup";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  messCode: string;
}

export function ShareModal({ open, onClose, messCode }: ShareModalProps) {
  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${origin}/dashboard/join-mess?code=${messCode}`;

  const message = `🏠 You've been invited to join our mess!\n\nInvite Code: ${messCode}\n\nJoin here:\n${inviteLink}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    }
  };

  const copyLink = async () => {
    await copyToClipboard(inviteLink);
    popup.success("Link copied!");
    onClose();
  };

  const copyCode = async () => {
    await copyToClipboard(messCode);
    popup.success("Invite code copied!");
    onClose();
  };

  const handleMessenger = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `fb-messenger://share?link=${encodeURIComponent(inviteLink)}`;
      onClose();
    } else {
      await copyToClipboard(inviteLink);
      popup.success("Link copied! Paste it in Messenger to share.");
      onClose();
    }
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my mess", text: message });
        popup.success("Shared successfully");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          popup.error("Sharing is not supported on this browser");
        }
      }
    } else {
      popup.error("Sharing is not supported on this browser");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:w-[380px] max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Share Invite</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0f0f5] flex items-center justify-center shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="#666" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Copy buttons */}
        <div className="space-y-2.5 mb-5">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#5b3fd6" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#5b3fd6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-[#333]">Copy Link</span>
          </button>

          <button
            onClick={copyCode}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="#5b3fd6" strokeWidth="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#5b3fd6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-[#333]">Copy Invite Code</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#e3e0f5]" />
          <span className="text-xs text-[#999] font-semibold">Share via</span>
          <div className="flex-1 h-px bg-[#e3e0f5]" />
        </div>

        {/* Share items */}
        <div className="space-y-2.5">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setTimeout(onClose, 300)}
            className="flex items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#e3faf0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setTimeout(onClose, 300)}
            className="flex items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#d7eefb" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0088CC">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012.056 0h-.112zM16.508 8.278l-1.77 8.336c-.133.603-.486.75-.983.468l-2.714-2.002-1.309 1.26c-.144.144-.265.265-.543.265l.193-2.762 5.02-4.537c.218-.193-.047-.299-.336-.106l-6.212 3.908-2.677-.837c-.582-.182-.591-.582.121-.863l10.468-4.035c.483-.175.906.118.752.863z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">Telegram</span>
          </a>

          {/* Messenger */}
          <button
            onClick={handleMessenger}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#e0edff" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#006AFF">
                <path d="M.001 11.639C.001 4.094 5.241.672 12.531.672c6.85 0 12.53 3.423 12.53 10.968 0 6.953-5.681 10.934-12.53 10.934-1.255 0-2.455-.16-3.588-.46l-3.924 1.38c-.616.213-1.126-.493-.782-.982l2.654-3.748A10.09 10.09 0 011.954 11.64c0-6.542 5.112-10.001 10.577-10.001C18.078 1.639 22 4.518 22 11.639c0 6.165-4.893 9.961-9.469 9.961-1.395 0-2.69-.213-3.867-.577l-3.468 1.223c-.408.142-.834-.23-.714-.66l1.018-3.59C1.374 17.498.001 14.865.001 11.639zm10.275-3.48c-.63 0-1.141.511-1.141 1.141s.511 1.141 1.141 1.141c.63 0 1.141-.511 1.141-1.141s-.511-1.141-1.141-1.141zm5.52 0c-.63 0-1.141.511-1.141 1.141s.511 1.141 1.141 1.141c.63 0 1.141-.511 1.141-1.141s-.511-1.141-1.141-1.141z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">Messenger</span>
          </button>

          {/* Email */}
          <a
            href={`mailto:?subject=Join Our Mess&body=${encodeURIComponent(message)}`}
            onClick={() => setTimeout(onClose, 300)}
            className="flex items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fbe4e4" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 6L2 7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">Email</span>
          </a>

          {/* More (native share) */}
          <button
            onClick={handleMore}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e3e0f5] p-3.5 hover:bg-[#f9f8fe] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#f0f0f5] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333]">More...</span>
          </button>
        </div>
      </div>
    </div>
  );
}
