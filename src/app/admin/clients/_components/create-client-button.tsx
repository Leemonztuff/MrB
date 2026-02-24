

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
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Agregar Cliente
                </span>
            </Button>
        </CreateClientDialog>
    );
}
