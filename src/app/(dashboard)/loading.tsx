export default function DashboardLoading() {
  return (
    <div className="space-y-4 max-w-lg md:max-w-4xl mx-auto pt-6 px-5 animate-pulse">
      {/* Nav skeleton */}
      <div className="flex items-center justify-between pb-4">
        <div className="w-10 h-10 bg-muted rounded-[14px]" />
        <div className="w-32 h-5 bg-muted rounded-lg" />
        <div className="w-10 h-10 bg-muted rounded-full" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted rounded-lg" />
        <div className="h-4 w-56 bg-muted rounded-lg" />

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-[18px] p-4 shadow-sm border border-border">
              <div className="h-3 w-20 bg-muted rounded mb-3" />
              <div className="h-7 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* List skeleton */}
        <div className="bg-card rounded-[18px] p-4 shadow-sm border border-border space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-2.5 w-20 bg-muted rounded" />
              </div>
              <div className="h-4 w-14 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
