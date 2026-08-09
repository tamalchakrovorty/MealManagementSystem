"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { popup } from "@/lib/popup";
import { DatePickerField } from "@/components/ui/date-picker-field";

type TabType = "post" | "group" | "individual" | "event";
type ModeType = "post" | "view";

interface Member {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export function NoticesTab({
  messId,
  notices,
  members,
  events,
}: {
  messId: string;
  notices: any[];
  members: Member[];
  events: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = (["post", "view"] as ModeType[]).includes(searchParams.get("mode") as ModeType)
    ? (searchParams.get("mode") as ModeType)
    : "post";
  const initialTab = (["post", "group", "individual", "event"] as TabType[]).includes(searchParams.get("tab") as TabType)
    ? (searchParams.get("tab") as TabType)
    : "post";

  const [mode, setMode] = useState<ModeType>(initialMode);
  const [tab, setTab] = useState<TabType>(initialTab);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLoading, setEventLoading] = useState(false);

  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const updateUrl = (newMode: ModeType, newTab: TabType) => {
    const params = new URLSearchParams();
    params.set("mode", newMode);
    params.set("tab", newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleModeChange = (newMode: ModeType) => {
    setMode(newMode);
    updateUrl(newMode, tab);
  };

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    updateUrl(mode, newTab);
  };

  const filteredMembers = members.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.user_id)));
    }
  };

  const handleSubmit = async (targetType: string, targetUserIds?: string[]) => {
    if (!message.trim()) { popup.error("Please write a message"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mess_id: messId,
          message: message.trim(),
          targetType,
          targetUserIds: targetUserIds || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); popup.error(d.error); }
      else {
        popup.success("Notice posted!");
        setMessage("");
        setSelectedIds(new Set());
        setSelectedSingle(null);
        setSearchQuery("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) { popup.error("Title and date required"); return; }
    setEventLoading(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          description: eventDescription.trim() || null,
          eventDate,
        }),
      });
      if (!res.ok) { const d = await res.json(); popup.error(d.error); }
      else {
        popup.success("Event created!");
        setEventTitle("");
        setEventDescription("");
        setEventDate("");
        router.refresh();
      }
    } finally {
      setEventLoading(false);
    }
  };

  const handleEditNotice = async (noticeId: string) => {
    if (!editingMessage.trim()) { popup.error("Message cannot be empty"); return; }
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noticeId, mess_id: messId, message: editingMessage.trim() }),
      });
      if (!res.ok) { const d = await res.json(); popup.error(d.error); }
      else {
        popup.success("Notice updated");
        setEditingNoticeId(null);
        setEditingMessage("");
        router.refresh();
      }
    } finally {
      setEditLoading(false);
    }
  };

  const startEditing = (notice: any) => {
    setEditingNoticeId(notice.id);
    setEditingMessage(notice.message);
  };

  const cancelEditing = () => {
    setEditingNoticeId(null);
    setEditingMessage("");
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    setDeleteLoading(noticeId);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noticeId, mess_id: messId }),
      });
      if (!res.ok) { const d = await res.json(); popup.error(d.error); }
      else {
        popup.success("Notice deleted");
        router.refresh();
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const viewNotices = notices.filter((n) => {
    if (tab === "post") return n.target_type === "all";
    if (tab === "group") return n.target_type === "group";
    if (tab === "individual") return n.target_type === "individual";
    return false;
  });

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <button
        type="button"
        onClick={() => handleModeChange(mode === "post" ? "view" : "post")}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] md:text-sm font-semibold border border-border bg-card shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:bg-muted transition-colors"
      >
        {mode === "post" ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Go View Mode
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Go Post Mode
          </>
        )}
      </button>

      {/* Tabs */}
      <div className="bg-muted rounded-[14px] p-1.5 flex overflow-x-auto gap-1 scrollbar-hide md:justify-center">
        {(["post", "group", "individual", "event"] as TabType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={`shrink-0 px-3 py-2.5 rounded-[10px] text-[12px] sm:text-[13px] font-bold transition-all whitespace-nowrap ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "post" && "Announcement"}
            {t === "group" && "Group Notice"}
            {t === "individual" && "Individual"}
            {t === "event" && "Create Event"}
          </button>
        ))}
      </div>

      {/* POST MODE */}
      {mode === "post" && tab === "post" && (
        <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <h3 className="text-[15px] font-bold mb-3">Post an Announcement</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit("all"); }} className="space-y-3">
            <textarea
              placeholder="Write your notice here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              className="w-full border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        </div>
      )}

      {mode === "post" && tab === "group" && (
        <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <h3 className="text-[15px] font-bold mb-3">Group Notice</h3>
          <textarea
            placeholder="Write your notice here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none mb-3"
          />

          <div className="border border-input rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 px-3 py-2.5 bg-muted border-b border-input cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === members.length && members.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-[#6a4fd8]"
              />
              <span className="text-sm font-semibold text-foreground">Select All ({members.length})</span>
            </label>
            <div className="max-h-[240px] overflow-y-auto grid grid-cols-1 md:grid-cols-2">
              {members.map((m) => (
                <label key={m.user_id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(m.user_id)}
                    onChange={() => toggleSelect(m.user_id)}
                    className="w-4 h-4 rounded accent-[#6a4fd8]"
                  />
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      m.name?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  <span className="text-sm text-foreground">{m.name || "Unknown"}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleSubmit("group", Array.from(selectedIds))}
            disabled={loading || selectedIds.size === 0 || !message.trim()}
            className="w-full mt-3 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60"
          >
            {loading ? "Posting..." : `Post to Selected (${selectedIds.size})`}
          </button>
        </div>
      )}

      {mode === "post" && tab === "individual" && (
        <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <h3 className="text-[15px] font-bold mb-3">Individual Notice</h3>
          <textarea
            placeholder="Write your notice here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none mb-3"
          />

          {selectedSingle ? (
            <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {members.find((m) => m.user_id === selectedSingle)?.avatar_url ? (
                    <img src={members.find((m) => m.user_id === selectedSingle)!.avatar_url!} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    members.find((m) => m.user_id === selectedSingle)?.name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {members.find((m) => m.user_id === selectedSingle)?.name || "Unknown"}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedSingle(null)} className="text-xs text-primary font-bold">
                Change
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors mb-2"
              />
              <div className="border border-input rounded-xl overflow-hidden max-h-[200px] overflow-y-auto grid grid-cols-1 md:grid-cols-2">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No members found</p>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => { setSelectedSingle(m.user_id); setSearchQuery(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          m.name?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                      <span className="text-sm text-foreground">{m.name || "Unknown"}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => handleSubmit("individual", selectedSingle ? [selectedSingle] : undefined)}
            disabled={loading || !selectedSingle || !message.trim()}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60"
          >
            {loading ? "Posting..." : `Post to ${selectedSingle ? members.find((m) => m.user_id === selectedSingle)?.name || "Member" : "..."}`}
          </button>
        </div>
      )}

      {mode === "post" && tab === "event" && (
        <div className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <h3 className="text-[15px] font-bold mb-3">Create Event</h3>
          <form onSubmit={handleEventSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Event Title</label>
              <input
                type="text"
                placeholder="e.g. Mess Meeting"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
                className="w-full border border-input rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date</label>
              <DatePickerField value={eventDate} onChange={setEventDate} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description (optional)</label>
              <textarea
                placeholder="What is this event about?"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
                className="w-full border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={eventLoading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            >
              {eventLoading ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {/* VIEW MODE — Events */}
      {mode === "view" && tab === "event" && (
        <div className="space-y-3">
          {events.length > 0 ? (
            events.map((event: any) => (
              <div
                key={event.id}
                className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] md:text-[15px] font-bold text-foreground mb-1">{event.title}</p>
                    <p className="text-[12px] md:text-[13px] text-muted-foreground">
                      {format(new Date(event.event_date), "EEE, d MMM yyyy")}
                    </p>
                    {event.description && (
                      <p className="text-[13px] md:text-[14px] text-muted-foreground mt-2 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-[18px] p-8 md:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] md:text-[16px] text-muted-foreground">No events yet</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE — Notices */}
      {mode === "view" && tab !== "event" && (
        <div className="space-y-3">
          {viewNotices.length > 0 ? (
            viewNotices.map((notice: any) => (
              <div
                key={notice.id}
                className="bg-card rounded-[18px] p-4 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border transition-all duration-300 md:hover:-translate-y-[2px] md:hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              >
                {editingNoticeId === notice.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingMessage}
                      onChange={(e) => setEditingMessage(e.target.value)}
                      rows={3}
                      className="w-full border border-primary rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditNotice(notice.id)}
                        disabled={editLoading || !editingMessage.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-60"
                      >
                        {editLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={editLoading}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[14px] md:text-[15px] text-foreground leading-relaxed mb-3 whitespace-pre-line">{notice.message}</p>
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] md:text-[12px] text-muted-foreground truncate">
                          {notice.author_name} · {format(new Date(notice.created_at), "d MMM, yyyy")}
                        </span>
                        {notice.edited_at && (
                          <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                            edited
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditing(notice)}
                          className="px-3 py-1.5 text-[11px] md:text-[12px] font-semibold text-primary bg-muted rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(notice.id)}
                          disabled={deleteLoading === notice.id}
                          className="px-3 py-1.5 text-[11px] md:text-[12px] font-semibold text-[#e5484d] bg-[#fef2f2] rounded-lg hover:bg-[#fde8e8] transition-colors disabled:opacity-60"
                        >
                          {deleteLoading === notice.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="bg-card rounded-[18px] p-8 md:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                  <path d="M18 8C18 5.79 16.21 4 14 4C12.5 4 11.2 4.8 10.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <rect x="3" y="8" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 13H12M8 16H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[14px] md:text-[16px] text-muted-foreground">
                {tab === "post" && "No announcements yet"}
                {tab === "group" && "No group notices yet"}
                {tab === "individual" && "No individual notices yet"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
