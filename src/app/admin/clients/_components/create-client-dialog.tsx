
"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClientForInvitation } from "@/app/admin/actions/clients.actions";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import { Copy, Check, Loader2, UserPlus, Link2 } from "lucide-react";
import { UpsertClientDialog } from "./upsert-client-dialog";
import type { Agreement } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export function CreateClientDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"options" | "invitation_config" | "link">("options");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (view === 'invitation_config') {
        getAgreements().then(({ data }) => setAgreements(data ?? []));
    }
  }, [view]);

  const handleGenerateLink = () => {
    startTransition(async () => {
      const result = await createClientForInvitation({
        name: clientName || null,
        agreementId: selectedAgreementId,
      });

      if (result.error || !result.data) {
        toast({
          title: "Error",
          description: result.error?.message || "No se pudo generar el enlace.",
          variant: "destructive",
        });
      } else {
        const origin = window.location.origin;
        setGeneratedLink(`${origin}/onboarding/${result.data.onboarding_token}`);
        setView("link");
      }
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast({ title: "Enlace de invitación copiado!" });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setView("options");
        setGeneratedLink("");
        setHasCopied(false);
        setClientName("");
        setSelectedAgreementId(null);
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
           <DialogDescription>
            {view === 'options' && "Elige cómo deseas agregar un nuevo cliente al sistema."}
            {view === 'invitation_config' && "Configura la invitación antes de generar el enlace."}
            {view === 'link' && "Comparte este enlace con tu cliente para que complete su alta."}
          </DialogDescription>
        </DialogHeader>

        {view === "options" && (
          <div className="grid grid-cols-1 gap-4 py-4">
            <UpsertClientDialog client={undefined}>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-1"
                onClick={() => setIsOpen(false)} // Close this dialog to open the other
              >
                <UserPlus className="h-6 w-6" />
                <span>Crear Manualmente</span>
                <span className="text-xs text-muted-foreground">
                  (Tú cargas todos los datos)
                </span>
              </Button>
            </UpsertClientDialog>

            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => setView('invitation_config')}
            >
              <Link2 className="h-6 w-6" />
              <span>Generar Enlace de Invitación</span>
              <span className="text-xs text-muted-foreground">
                (El cliente carga sus datos)
              </span>
            </Button>
          </div>
        )}

        {view === "invitation_config" && (
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="client-name">Nombre del Cliente (Opcional)</Label>
                    <Input 
                        id="client-name"
                        placeholder="Para identificarlo en la lista"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="agreement-select">Asignar Convenio (Opcional)</Label>
                     <Select 
                        onValueChange={(value) => setSelectedAgreementId(value === 'null' ? null : value)} 
                        defaultValue="null"
                    >
                        <SelectTrigger id="agreement-select">
                            <SelectValue placeholder="Selecciona un convenio..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Ninguno por ahora</SelectItem>
                            {agreements.map(agreement => (
                                <SelectItem key={agreement.id} value={agreement.id}>
                                {agreement.agreement_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Si asignas un convenio, el cliente podrá hacer pedidos inmediatamente después de registrarse.
                    </p>
                </div>

                <DialogFooter className="!mt-6">
                    <Button variant="ghost" onClick={() => setView('options')}>Volver</Button>
                    <Button onClick={handleGenerateLink} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Enlace"}
                    </Button>
                </DialogFooter>
            </div>
        )}

        {view === "link" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <input
                value={generatedLink}
                readOnly
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              />
              <Button
                size="icon"
                className="h-10 w-10"
                onClick={copyToClipboard}
              >
                {hasCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter className="!mt-6">
                <Button variant="secondary" onClick={() => setView('invitation_config')}>Volver</Button>
                <Button onClick={() => handleOpenChange(false)}>Finalizar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
