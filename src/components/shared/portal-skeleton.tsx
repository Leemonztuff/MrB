
'use client';

export function PortalCardSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
    );
}

export function PortalListSkeleton({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/10 rounded" />
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-white/10 rounded" />
                </div>
            ))}
        </div>
    );
}

export function PortalProductSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row w-full overflow-hidden border border-border/50 rounded-xl animate-pulse">
            <div className="w-full sm:w-24 h-24 bg-white/10 shrink-0" />
            <div className="flex flex-col justify-between w-full gap-2 p-4">
                <div className="space-y-2">
                    <div className="h-5 w-3/4 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                </div>
                <div className="flex items-center justify-between">
                    <div className="h-6 w-20 bg-white/10 rounded" />
                    <div className="h-8 w-32 bg-white/10 rounded" />
                </div>
            </div>
        </div>
    );
}

export function PortalProfileSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/10" />
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-48 bg-white/5 rounded" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-12 w-full bg-white/5 rounded-xl" />
                <div className="h-12 w-full bg-white/5 rounded-xl" />
                <div className="h-12 w-full bg-white/5 rounded-xl" />
            </div>
        </div>
    );
}
