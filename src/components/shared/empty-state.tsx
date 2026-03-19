
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
            <Card className={cn("border-dashed", className)}>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-full bg-primary/10 mb-4">
                        <Icon className="h-8 w-8 text-primary/60" />
                    </div>
                    <h3 className="text-lg font-black italic tracking-tight uppercase mb-2">
                        {title}
                    </h3>
                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60 max-w-xs mb-4">
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
            <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
                <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs">{description}</p>
                {children && (
                    <div className="mt-4">{children}</div>
                )}
            </div>
        );
    }

    return (
        <Card className={cn("flex flex-col items-center justify-center py-16 border-dashed animate-fade-in", className)}>
           <CardHeader className="text-center">
               <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                 <Icon className="h-8 w-8 text-primary" />
                 <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary/60 animate-pulse" />
               </div>
               <CardTitle className="mt-6 text-xl font-bold">{title}</CardTitle>
               <CardDescription className="max-w-sm mx-auto mt-2">
                 {description}
               </CardDescription>
           </CardHeader>
           {children && (
              <CardContent className="animate-fade-in">
                {children}
            </CardContent>
            )}
        </Card>
    );
}

export { EmptyState as PortalEmptyState };
