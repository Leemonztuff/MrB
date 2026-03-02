
import { Skeleton, SkeletonTable, SkeletonPageHeader, SkeletonButton } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SkeletonPageHeader />
      
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-72 rounded-md" />
        <SkeletonButton />
      </div>

      <SkeletonTable rows={6} />
    </div>
  )
}
