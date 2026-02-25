

"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CreateClientDialog } from "./create-client-dialog";
import { useSearchParams } from "next/navigation";

export function CreateClientButton() {
    const searchParams = useSearchParams();
    const query = searchParams.get("query");

    // Don't show the "Add Client" button when there is an active search,
    // as it conflicts with the "no results" empty state.
    if (query) {
        return null;
    }

    return (
        <CreateClientDialog>
            <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
                    Agregar Cliente
                </span>
            </Button>
        </CreateClientDialog>
    );
}
