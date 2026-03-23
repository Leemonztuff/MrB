

"use client"

import { useCallback, useEffect, useState } from "react";
import type { Client } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { ClientActionButtons } from "./client-action-buttons";
import { cn } from "@/lib/utils";


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
    <div className="group flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer" onClick={handleCopy}>
      <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{label}:</span>
      <span className="text-foreground text-xs font-medium truncate max-w-[150px]">{value || 'No disponible'}</span>
      {value && (
        <div className="shrink-0">
          {hasCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      )}
    </div>
  );
};

const statusMap: Record<Client['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_onboarding: { label: "Pendiente Alta", variant: "secondary" },
  pending_agreement: { label: "Pendiente Convenio", variant: "destructive" },
  active: { label: "Activo", variant: "default" },
  archived: { label: "Archivado", variant: "outline" },
};

interface ClientHeaderProps {
  client: Client;
  onArchive: () => void;
  isArchiving: boolean;
  onCopyLink: (link: string | null, message: string, errorMessage?: string) => void;
  orderLink: string | null;
  editDialog: React.ReactNode;
  agreementDialog: React.ReactNode;
  whatsappNumber?: string;
}

export function ClientHeader({
  client,
  onArchive,
  isArchiving,
  onCopyLink,
  orderLink,
  editDialog,
  agreementDialog,
  whatsappNumber = "",
}: ClientHeaderProps) {
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && client.onboarding_token) {
      setOnboardingLink(`${window.location.origin}/onboarding/${client.onboarding_token}`);
    }
  }, [client.onboarding_token]);

  const status = statusMap[client.status];

  return (
    <div className="w-full">
      <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          {/* Avatar Section */}
          <div className="flex shrink-0 items-center gap-4">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary/10">
              <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary/5 text-primary">
                {client?.contact_name?.charAt(0).toUpperCase() ?? 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="sm:hidden flex flex-col gap-1">
              <h2 className="text-xl font-bold leading-none">{client.contact_name}</h2>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                  {client.agreements?.agreement_name || 'Sin Convenio'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="hidden sm:flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight truncate">{client.contact_name}</h2>
              <div className="flex items-center gap-2">
                <div className="h-4 w-px bg-border/60 mx-1" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  {client.agreements?.agreement_name || 'Sin Convenio'}
                </span>
                <div className="h-4 w-px bg-border/60 mx-1" />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-border/50",
                  client.status === 'active' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
                )}>
                  {status.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-4 -ml-2">
              <CopyableField label="Email" value={client.email} onCopy={onCopyLink} />
              <CopyableField label="CUIT" value={client.cuit} onCopy={onCopyLink} />
            </div>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <ClientActionButtons
            onArchive={onArchive}
            isArchiving={isArchiving}
            onCopyLink={onCopyLink}
            orderLink={orderLink}
            onboardingLink={onboardingLink}
            editDialog={editDialog}
            agreementDialog={agreementDialog}
            clientStatus={client.status}
            clientName={client.contact_name || ""}
            whatsappNumber={whatsappNumber}
          />
        </div>
      </div>
    </div>
  );
}
