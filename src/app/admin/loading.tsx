
import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SkeletonPageHeader />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonCard />
    </div>
  )
}
