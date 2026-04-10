
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = 'admin' | 'portal' | 'minimal';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    children?: React.ReactNode;
    variant?: EmptyStateVariant;
    className?: string;
}

export function EmptyState({ 
    icon: Icon, 
    title, 
    description, 
    children, 
    variant = 'admin',
    className = ''
}: EmptyStateProps) {
    if (variant === 'portal') {
        return (
            <Card className={cn("border-dashed glass-card", className)}>
                <CardContent className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4">
                    <div className="p-3 sm:p-4 rounded-full bg-primary/10 mb-3 sm:mb-4">
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black italic tracking-tight uppercase mb-2">
                        {title}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/60 max-w-xs mb-4">
                        {description}
                    </p>
                    {children && (
                        <div className="animate-fade-in mt-2">
                            {children}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (variant === 'minimal') {
        return (
            <div className={cn("flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4", className)}>
                <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">{title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground/60 max-w-xs">{description}</p>
                {children && (
                    <div className="mt-4">{children}</div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("flex flex-col items-center justify-center py-10 sm:py-16 border-dashed animate-fade-in", className)}>
           <CardHeader className="text-center px-4">
               <div className="relative mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                 <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                 <Sparkles className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-primary/60 animate-pulse" />
               </div>
               <CardTitle className="mt-4 sm:mt-6 text-lg sm:text-xl font-black italic tracking-tight">{title}</CardTitle>
               <CardDescription className="max-w-sm mx-auto mt-2 text-xs sm:text-sm">
                 {description}
               </CardDescription>
           </CardHeader>
           {children && (
              <CardContent className="animate-fade-in px-4">
                {children}
            </CardContent>
            )}
        </Card>
    );
}

export { EmptyState as PortalEmptyState };
