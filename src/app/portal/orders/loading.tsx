
import { Skeleton, SkeletonTable, SkeletonPageHeader } from "@/components/shared/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <SkeletonPageHeader />
      
      <SkeletonTable rows={8} />
    </div>
  )
}
