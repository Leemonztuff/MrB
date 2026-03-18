
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

type PortalEmptyStateProps = {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function PortalEmptyState({ 
    icon: Icon = Package, 
    title, 
    description, 
    action, 
    className = '' 
}: PortalEmptyStateProps) {
    return (
        <Card className={`border-dashed ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-black italic tracking-tight uppercase mb-2">
                    {title}
                </h3>
                {description && (
                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60 max-w-xs mb-4">
                        {description}
                    </p>
                )}
                {action && (
                    <div className="animate-fade-in mt-2">
                        {action}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
