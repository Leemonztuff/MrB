
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description: string;
    children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center py-12 border-dashed">
           <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">{title}</CardTitle>
              <CardDescription>
                {description}
              </CardDescription>
            </CardHeader>
            {children && (
             <CardContent>
                {children}
            </CardContent>
            )}
        </Card>
    );
}
