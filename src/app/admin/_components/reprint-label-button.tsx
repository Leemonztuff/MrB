
"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { openPrintPage } from "@/lib/print-helpers";

export function ReprintLabelButton({ orderId, bundles = 1 }: { orderId: string; bundles?: number }) {
    const handleReprint = () => {
        openPrintPage([{ id: orderId, bundles }]);
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
