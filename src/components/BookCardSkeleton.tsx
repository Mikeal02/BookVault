
interface BookCardSkeletonProps {
  count?: number;
}

export const BookCardSkeleton = ({ count = 1 }: BookCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="p-3.5">
            {/* Cover shimmer */}
            <div className="relative mb-3 rounded-xl aspect-[2/3] overflow-hidden bg-muted">
              <div className="absolute inset-0 skeleton-gold" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded-md w-[80%] animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-3.5 bg-muted/70 rounded-md w-[55%] animate-pulse" style={{ animationDelay: `${i * 80 + 100}ms` }} />
              <div className="h-3 bg-muted/50 rounded-md w-[40%] animate-pulse" style={{ animationDelay: `${i * 80 + 200}ms` }} />
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-3 h-3 bg-muted/30 rounded-full animate-pulse" style={{ animationDelay: `${j * 50}ms` }} />
                ))}
              </div>
              {/* Badge */}
              <div className="flex gap-1">
                <div className="h-4 bg-muted/30 rounded-md w-14 animate-pulse" />
                <div className="h-4 bg-muted/30 rounded-md w-10 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="px-3.5 pb-3.5">
            <div className="h-9 bg-muted/30 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
};
