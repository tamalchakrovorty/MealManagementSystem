export default function NotificationsLoading() {
  return (
    <div className="space-y-4 max-w-lg md:max-w-3xl mx-auto pt-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="w-10 h-10 bg-muted rounded-lg" />
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-[16px] p-1.5 flex gap-2">
        <div className="flex-1 h-10 bg-primary/20 rounded-[12px]" />
        <div className="flex-1 h-10 bg-muted rounded-[12px]" />
        <div className="flex-1 h-10 bg-muted rounded-[12px]" />
      </div>

      {/* Notification list */}
      <div className="bg-card rounded-[18px] p-4 shadow-sm border border-border space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-muted shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-2.5 w-32 bg-muted rounded" />
            </div>
            <div className="h-3 w-14 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
