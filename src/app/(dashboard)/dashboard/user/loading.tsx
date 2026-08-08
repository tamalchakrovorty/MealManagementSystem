export default function UserLoading() {
  return (
    <div className="space-y-4 max-w-lg md:max-w-4xl mx-auto pt-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 bg-muted rounded-lg" />
        <div className="h-4 w-52 bg-muted rounded" />
      </div>

      {/* Tab toggle */}
      <div className="bg-card rounded-[16px] p-1.5 flex gap-2">
        <div className="flex-1 h-11 bg-primary/20 rounded-[12px]" />
        <div className="flex-1 h-11 bg-muted rounded-[12px]" />
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-[18px] p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-muted shrink-0" />
        <div className="space-y-2">
          <div className="h-5 w-28 bg-muted rounded" />
          <div className="h-3.5 w-40 bg-muted rounded" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[18px] p-4 shadow-sm">
            <div className="h-3 w-20 bg-muted rounded mb-3" />
            <div className="h-7 w-16 bg-muted rounded mb-2" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-[18px] p-4 shadow-sm flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-muted" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
