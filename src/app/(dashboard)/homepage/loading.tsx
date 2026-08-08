export default function HomepageLoading() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-lg md:max-w-4xl mx-auto pt-6 animate-pulse">
      {/* Notice card */}
      <div className="rounded-[18px] p-5 bg-muted/50 h-36" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[16px] p-4 shadow-sm border border-border">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-muted mb-2" />
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Menu section */}
      <div className="flex justify-between items-center">
        <div className="h-5 w-28 bg-muted rounded" />
        <div className="h-4 w-14 bg-muted rounded" />
      </div>

      {/* Menu cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[16px] p-4 flex items-center justify-between shadow-sm border border-border">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-2.5 w-20 bg-muted rounded" />
            </div>
            <div className="w-[72px] h-[72px] rounded-[14px] bg-muted shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
