
"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ReprintLabelButton({ orderId }: { orderId: string }) {
    const handleReprint = () => {
        const data = JSON.stringify([{ id: orderId, bundles: 1 }]);
        window.open(`/admin/imprimir/rotulos?data=${encodeURIComponent(data)}`, '_blank');
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReprint}
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Re-imprimir rótulo</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
