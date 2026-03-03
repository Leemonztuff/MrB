"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { NewsForm } from "./news-form";

export function NewsCreateDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                        Nueva Noticia
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva noticia</DialogTitle>
                    <DialogDescription>
                        Crea una nueva noticia para el portal del cliente.
                    </DialogDescription>
                </DialogHeader>
                <NewsForm
                    onClose={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
