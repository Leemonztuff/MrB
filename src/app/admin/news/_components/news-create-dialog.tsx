"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewsForm } from "./news-form";

export function NewsCreateDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="h-10 gap-2 rounded-xl bg-primary font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only italic sm:not-sr-only sm:whitespace-nowrap">Nueva Noticia</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(90dvh,860px)] flex-col overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="border-b border-border/60 px-6 py-5">
                    <DialogTitle>Nueva noticia</DialogTitle>
                    <DialogDescription>Crea una nueva noticia para el portal del cliente.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="min-h-0 flex-1">
                    <div className="p-6">
                        <NewsForm
                            onClose={() => {
                                setOpen(false);
                                router.refresh();
                            }}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
