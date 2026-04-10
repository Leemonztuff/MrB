
'use client';

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-md bg-muted/30", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
    );
}

export function PortalCardSkeleton() {
    return (
        <div className="space-y-3 sm:space-y-4">
            <Shimmer className="h-28 sm:h-32 rounded-2xl" />
        </div>
    );
}

export function PortalListSkeleton({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl">
                    <Shimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5 sm:space-y-2">
                        <Shimmer className="h-4 w-3/4 rounded" />
                        <Shimmer className="h-3 w-1/2 rounded" />
                    </div>
                    <Shimmer className="h-5 w-14 sm:w-16 rounded shrink-0" />
                </div>
            ))}
        </div>
    );
}

export function PortalProductSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row w-full overflow-hidden border border-border/50 rounded-xl">
            <Shimmer className="w-full sm:w-20 h-20 sm:h-24 shrink-0" />
            <div className="flex flex-col justify-between w-full gap-2 p-3 sm:p-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <Shimmer className="h-5 w-3/4 rounded" />
                    <Shimmer className="h-3 w-full rounded" />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Shimmer className="h-6 w-20 rounded" />
                    <Shimmer className="h-8 sm:h-9 w-28 sm:w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function PortalProfileSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 sm:gap-4">
                <Shimmer className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shrink-0" />
                <div className="space-y-1.5 sm:space-y-2">
                    <Shimmer className="h-5 w-28 sm:w-32 rounded" />
                    <Shimmer className="h-3 w-40 sm:w-48 rounded" />
                </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
                <Shimmer className="h-10 sm:h-12 w-full rounded-xl" />
                <Shimmer className="h-10 sm:h-12 w-full rounded-xl" />
                <Shimmer className="h-10 sm:h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}

export function PortalNewsCardSkeleton() {
    return (
        <div className="space-y-3 sm:space-y-4">
            <Shimmer className="w-full aspect-[16/9] rounded-2xl" />
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                <Shimmer className="h-3 w-20 sm:w-24 rounded" />
                <Shimmer className="h-5 w-3/4 rounded" />
                <div className="space-y-1.5 sm:space-y-2">
                    <Shimmer className="h-3 w-full rounded" />
                    <Shimmer className="h-3 w-5/6 rounded" />
                </div>
            </div>
        </div>
    );
}
