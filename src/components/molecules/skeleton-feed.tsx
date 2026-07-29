export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-bg-primary border border-border-primary animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-bg-secondary" />
            <div className="flex-1">
              <div className="h-4 bg-bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-bg-secondary rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-bg-secondary rounded w-full" />
            <div className="h-4 bg-bg-secondary rounded w-5/6" />
            <div className="h-4 bg-bg-secondary rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}