
import { cn } from "@/lib/utils"

type SkeletonProps = {
  className?: string
}

export function Skeleton({
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/50",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-3 sm:space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-16 sm:h-20 w-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="border-b p-3 sm:p-4">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b p-3 sm:p-4 last:border-0">
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border">
          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
          <div className="space-y-1.5 sm:space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonButton() {
  return (
    <Skeleton className="h-9 sm:h-10 w-20 sm:w-24 rounded-md" />
  )
}

export function SkeletonInput() {
  return (
    <Skeleton className="h-9 sm:h-10 w-full rounded-md" />
  )
}

export function SkeletonAvatar() {
  return (
    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
  )
}

export function SkeletonBadge() {
  return (
    <Skeleton className="h-5 w-14 sm:w-16 rounded-full" />
  )
}

export function SkeletonPageHeader() {
  return (
    <div className="space-y-3 sm:space-y-4 mb-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
        <div className="space-y-1.5 sm:space-y-2">
          <Skeleton className="h-7 sm:h-8 w-40 sm:w-48" />
          <Skeleton className="h-3 w-28 sm:w-32" />
        </div>
      </div>
    </div>
  )
}
