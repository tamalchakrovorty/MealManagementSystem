export default function AdminLoading() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto pt-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="w-[46px] h-[46px] bg-muted rounded-[14px]" />
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted rounded-lg" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Tab toggle */}
      <div className="bg-card rounded-[16px] p-1.5 flex gap-2">
        <div className="flex-1 h-11 bg-primary/20 rounded-[12px]" />
        <div className="flex-1 h-11 bg-muted rounded-[12px]" />
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[18px] p-4 shadow-sm border border-border">
            <div className="h-3 w-24 bg-muted rounded mb-3" />
            <div className="h-8 w-20 bg-muted rounded mb-2" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Pending cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[18px] p-4 shadow-sm border border-border">
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-7 w-10 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Member list */}
      <div className="bg-card rounded-[18px] p-4 shadow-sm border border-border space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-2.5 w-36 bg-muted rounded" />
            </div>
            <div className="h-5 w-16 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
