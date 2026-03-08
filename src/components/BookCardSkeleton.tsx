import { Book } from '@/types/book';

interface BookCardSkeletonProps {
  count?: number;
}

export const BookCardSkeleton = ({ count = 1 }: BookCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
          <div className="p-4">
            {/* Cover skeleton */}
            <div className="relative mb-3 rounded-lg aspect-[3/4] skeleton-gold" />
            <div className="space-y-2">
              {/* Title */}
              <div className="h-4 bg-muted rounded-md w-3/4" />
              <div className="h-4 bg-muted rounded-md w-1/2" />
              {/* Author */}
              <div className="h-3 bg-muted/60 rounded-md w-2/3" />
              {/* Rating */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-3 h-3 bg-muted/40 rounded-full" />
                ))}
              </div>
              {/* Badge */}
              <div className="h-5 bg-muted/40 rounded-md w-16" />
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="h-10 bg-muted/40 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
};
