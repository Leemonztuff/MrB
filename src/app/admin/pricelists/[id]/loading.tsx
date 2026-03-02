
import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SkeletonPageHeader />
      
      <SkeletonCard />

      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
