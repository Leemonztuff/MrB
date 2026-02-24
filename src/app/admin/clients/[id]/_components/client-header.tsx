

"use client"

import { useCallback, useEffect, useState } from "react";
import type { Client } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { ClientActionButtons } from "./client-action-buttons";


const CopyableField = ({ label, value, onCopy }: { label: string; value: string | null; onCopy: (text: string, message: string) => void; }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!value) return;
        onCopy(value, `${label} copiado`);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="group relative flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">{value || 'No disponible'}</span>
             {value && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleCopy}>
                    {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copiar {label}</span>
                </Button>
            )}
        </div>
    );
};


export function ClientHeader({ 
    client, 
    onArchive, 
    isArchiving, 
    onCopyLink, 
    orderLink,
    editDialog,
    agreementDialog,
}: { 
    client: Client;
    onArchive: () => void;
    isArchiving: boolean;
    onCopyLink: (link: string | null, message: string, errorMessage?: string) => void;
    orderLink: string | null;
    editDialog: React.ReactNode;
    agreementDialog: React.ReactNode;
 }) {
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && client.onboarding_token) {
      setOnboardingLink(`${window.location.origin}/onboarding/${client.onboarding_token}`);
    }
  }, [client.onboarding_token]);


  return (
    <div className="w-full">
      <div className="relative flex flex-col items-center justify-center rounded-xl bg-card p-6 shadow-sm gap-2 border">
        
        <Avatar className="w-24 h-24 mb-2">
          <AvatarFallback className="text-4xl">
            {client.contact_name?.charAt(0).toUpperCase() ?? 'C'}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
            <h2 className="text-2xl font-bold">{client.contact_name}</h2>
            <CopyableField label="Email" value={client.email} onCopy={onCopyLink} />
            <CopyableField label="CUIT" value={client.cuit} onCopy={onCopyLink} />
        </div>
        <div className="w-full pt-6">
             <ClientActionButtons 
                onArchive={onArchive}
                isArchiving={isArchiving}
                onCopyLink={onCopyLink}
                orderLink={orderLink}
                onboardingLink={onboardingLink}
                editDialog={editDialog}
                agreementDialog={agreementDialog}
                clientStatus={client.status}
            />
        </div>
      </div>
    </div>
  );
}
