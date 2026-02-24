
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Minus, Maximize2, StickyNote } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type OrderNoteWidgetProps = {
    clientName: string;
    note: string;
    isMinimized: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
}

export function OrderNoteWidget({ 
    clientName, 
    note, 
    isMinimized, 
    onClose, 
    onMinimize,
    onMaximize
}: OrderNoteWidgetProps) {

    if (isMinimized) {
        return (
            <Card className="w-64 bg-secondary/80 backdrop-blur-sm shadow-2xl animate-in fade-in-50 slide-in-from-bottom-5">
                <CardHeader className="flex flex-row items-center justify-between p-2">
                     <button onClick={onMaximize} className="flex items-center gap-2 text-left flex-grow cursor-pointer">
                        <StickyNote className="h-4 w-4 text-secondary-foreground"/>
                        <p className="text-sm font-semibold text-secondary-foreground truncate">Nota de {clientName}</p>
                    </button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-secondary-foreground" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-80 bg-secondary/95 backdrop-blur-md shadow-2xl animate-in fade-in-50 slide-in-from-bottom-5">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Nota de Pedido</CardTitle>
                        <CardDescription className="text-secondary-foreground/80">{clientName}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                        {onMinimize && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground" onClick={onMinimize}>
                                <Minus className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-secondary-foreground" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ScrollArea className="h-40">
                    <p className="text-sm whitespace-pre-wrap">{note}</p>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
