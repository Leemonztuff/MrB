
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


import { UpsertClientForm } from "./upsert-client-form";

export function CreateClientDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"options" | "invitation_config" | "link" | "manual">("options");
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
      <DialogContent className={view === 'manual' ? "sm:max-w-3xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            {view === 'options' && "Elige cómo deseas agregar un nuevo cliente al sistema."}
            {view === 'invitation_config' && "Configura la invitación antes de generar el enlace."}
            {view === 'link' && "Comparte este enlace con tu cliente para que complete su alta."}
            {view === 'manual' && "Completa todos los datos del cliente manualmente."}
          </DialogDescription>
        </DialogHeader>

        {view === "options" && (
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-1 rounded-xl glass border-white/5 hover:bg-white/5"
              onClick={() => setView('manual')}
            >
              <UserPlus className="h-6 w-6 text-primary" />
              <span className="font-black italic tracking-tighter">Crear Manualmente</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                (Tú cargas todos los datos)
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-1 rounded-xl glass border-white/5 hover:bg-white/5"
              onClick={() => setView('invitation_config')}
            >
              <Link2 className="h-6 w-6 text-primary" />
              <span className="font-black italic tracking-tighter">Generar Enlace de Invitación</span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                (El cliente carga sus datos)
              </span>
            </Button>
          </div>
        )}

        {view === "manual" && (
          <div className="py-2">
            <UpsertClientForm
              onSuccess={() => {
                handleOpenChange(false);
              }}
              onCancel={() => setView('options')}
            />
          </div>
        )}

        {view === "invitation_config" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-[10px] font-black uppercase tracking-widest opacity-60">Nombre del Cliente (Opcional)</Label>
              <Input
                id="client-name"
                placeholder="Para identificarlo en la lista"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="glass border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agreement-select" className="text-[10px] font-black uppercase tracking-widest opacity-60">Asignar Convenio (Opcional)</Label>
              <Select
                onValueChange={(value) => setSelectedAgreementId(value === 'null' ? null : value)}
                defaultValue="null"
              >
                <SelectTrigger id="agreement-select" className="glass border-white/10 rounded-xl">
                  <SelectValue placeholder="Selecciona un convenio..." />
                </SelectTrigger>
                <SelectContent className="glass border-white/5">
                  <SelectItem value="null">Ninguno por ahora</SelectItem>
                  {agreements.map(agreement => (
                    <SelectItem key={agreement.id} value={agreement.id}>
                      {agreement.agreement_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground font-medium italic">
                Si asignas un convenio, el cliente podrá hacer pedidos inmediatamente después de registrarse.
              </p>
            </div>

            <DialogFooter className="!mt-6 gap-3">
              <Button variant="ghost" onClick={() => setView('options')} className="rounded-xl">Volver</Button>
              <Button onClick={handleGenerateLink} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Enlace"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {view === "link" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Input
                value={generatedLink}
                readOnly
                className="glass border-white/10 rounded-xl italic font-medium"
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 rounded-xl"
                onClick={copyToClipboard}
              >
                {hasCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter className="!mt-6 gap-3">
              <Button variant="secondary" onClick={() => setView('invitation_config')} className="glass border-white/5 rounded-xl">Volver</Button>
              <Button onClick={() => handleOpenChange(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl">Finalizar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
