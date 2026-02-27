
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center py-16 border-dashed animate-fade-in">
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
