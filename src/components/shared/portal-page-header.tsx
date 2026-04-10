
import type { LucideIcon } from "lucide-react";

type PortalPageHeaderProps = {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function PortalPageHeader({ icon: Icon, title, description, action, className = '' }: PortalPageHeaderProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    {Icon && (
                        <div className="p-1.5 sm:p-2 rounded-xl bg-primary/10">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase">
                        {title}
                    </h1>
                </div>
                {action && (
                    <div className="animate-fade-in">
                        {action}
                    </div>
                )}
            </div>
            {description && (
                <p className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-muted-foreground/60 ml-1">
                    {description}
                </p>
            )}
        </div>
    );
}
