
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
        <div className="space-y-4">
            {clients.map((client) => (
                <div key={client.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://avatar.vercel.sh/${client.id}.png`} alt="Avatar" />
                        <AvatarFallback>{client.contact_name?.charAt(0) ?? 'C'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {client.contact_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {client.email}
                        </p>
                    </div>
                     <AssignAgreementDialog client={client}>
                        <Button variant="outline" size="sm" className="ml-auto">
                            <Edit className="h-4 w-4 mr-2" />
                           Asignar Convenio
                        </Button>
                    </AssignAgreementDialog>
                </div>
            ))}
        </div>
    );
}

    