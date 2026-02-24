
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";
import { AssignAgreementDialog } from "../../_components/assign-agreement-dialog";
import Link from "next/link";
import { Edit, Copy, Check } from "lucide-react";
import { OnboardingFormDialog } from "./onboarding-form-dialog";

const statusMap: Record<Client['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending_onboarding: { label: "Pendiente de Alta", variant: "secondary" },
    pending_agreement: { label: "Pendiente de Convenio", variant: "destructive" },
    active: { label: "Activo", variant: "default" },
    archived: { label: "Archivado", variant: "outline" },
};

const CopyableInfoItem = ({ label, value, onCopy }: { label: string; value: string | null; onCopy: (text: string, message: string) => void; }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        onCopy(value, `${label} copiado al portapapeles`);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="space-y-1 text-sm">
            <p className="font-medium">{label}</p>
            <div className="flex items-start justify-between gap-2 text-muted-foreground">
                <p className="break-words w-full">{value ?? "No especificado"}</p>
                {value && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
                        {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        <span className="sr-only">Copiar {label}</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export function ClientInfo({ client, onCopy }: { client: Client, onCopy: (text: string, message: string) => void }) {

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Datos del Cliente</CardTitle>
        <OnboardingFormDialog client={client}>
            <Button variant="outline" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar datos del cliente</span>
            </Button>
        </OnboardingFormDialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
            <p className="font-medium">Estado</p>
            <div><Badge variant={statusMap[client.status].variant}>{statusMap[client.status].label}</Badge></div>
        </div>
        
        <div className="space-y-1 text-sm">
          <p className="font-medium">Convenio Asignado</p>
          <div className="flex items-center gap-2">
            {client.agreements ? (
              <Button variant="link" asChild className="p-0 h-auto font-semibold">
                <Link href={`/admin/agreements/${client.agreement_id}`}>{client.agreements.agreement_name}</Link>
              </Button>
            ) : (
              <p className="text-muted-foreground">Ninguno</p>
            )}
             <AssignAgreementDialog client={client}>
                <Button variant="outline" size="sm" className="h-7 text-xs">Cambiar</Button>
             </AssignAgreementDialog>
          </div>
        </div>

        <CopyableInfoItem label="Dirección de Entrega" value={client.address} onCopy={onCopy} />
        <CopyableInfoItem label="Ventana de Entrega" value={client.delivery_window} onCopy={onCopy} />
        <CopyableInfoItem label="Instagram" value={client.instagram} onCopy={onCopy} />

      </CardContent>
    </Card>
  );
}
