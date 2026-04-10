import { SkeletonPageHeader, Skeleton } from "@/components/shared/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="card">
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="w-12 h-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}