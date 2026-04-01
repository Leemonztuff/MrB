
"use client";

import { useMemo, useState } from "react";
import type { Client } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AssignAgreementDialog } from "../clients/_components/assign-agreement-dialog";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";

export function PendingClients({ clients }: { clients: Client[] }) {
    const PAGE_SIZE = 5;
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedClients = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return clients.slice(start, start + PAGE_SIZE);
    }, [clients, safePage]);

    if (clients.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <p>No hay clientes pendientes.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-3">
            {paginatedClients.map((client) => (
                <div key={client.id} className="flex items-center gap-4 p-3 rounded-xl glass border-white/5 hover:bg-white/5 transition-all group">
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                            <AvatarImage src={`https://avatar.vercel.sh/${client.id}.png`} alt="Avatar" />
                            <AvatarFallback className="bg-secondary text-primary font-black uppercase text-xs">{client.contact_name?.charAt(0) ?? 'C'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-headline text-sm font-black truncate leading-tight">
                            {client.contact_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate mt-0.5">
                            {client.email}
                        </p>
                    </div>
                    <AssignAgreementDialog client={client}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto h-8 px-3 text-[10px] font-black uppercase tracking-widest gap-2 bg-secondary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <Edit className="h-3 w-3" />
                            <span className="hidden sm:inline italic">Asignar</span>
                        </Button>
                    </AssignAgreementDialog>
                </div>
            ))}

            {clients.length > PAGE_SIZE && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Pagina {safePage} de {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={safePage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Pagina anterior</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={safePage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Pagina siguiente</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
