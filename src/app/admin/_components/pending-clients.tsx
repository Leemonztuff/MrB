
"use client";

import type { Client } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AssignAgreementDialog } from "../clients/_components/assign-agreement-dialog";
import { Edit } from "lucide-react";

export function PendingClients({ clients }: { clients: Client[] }) {

    if (clients.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                <p>No hay clientes pendientes.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-3">
            {clients.map((client) => (
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
        </div>
    );
}

