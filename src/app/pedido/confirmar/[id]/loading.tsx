
import { Skeleton, SkeletonCard, SkeletonPageHeader } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SkeletonPageHeader />
      
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
