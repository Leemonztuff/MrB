
import { Skeleton, SkeletonCard } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <SkeletonCard />
      </div>
    </div>
  )
}
