
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
import { cn } from "@/lib/utils";

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
      <DialogContent className={cn(
        "grid-rows-[auto_1fr] p-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out",
        view === 'manual' ? "sm:max-w-3xl h-[90vh] sm:h-[80vh]" : "sm:max-w-md h-auto"
      )}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-black italic tracking-tighter text-2xl">Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
            {view === 'options' && "Elige cómo deseas agregar un nuevo cliente al sistema."}
            {view === 'invitation_config' && "Configura la invitación antes de generar el enlace."}
            {view === 'link' && "Comparte este enlace con tu cliente para que complete su alta."}
            {view === 'manual' && "Completa todos los datos del cliente manualmente."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {view === "options" && (
            <div className="grid grid-cols-1 gap-4 p-6">
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-1 rounded-2xl glass border-white/5 hover:bg-white/5 transition-all group"
                onClick={() => setView('manual')}
              >
                <UserPlus className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black italic tracking-tighter text-lg">Crear Manualmente</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  (Tú cargas todos los datos)
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-28 flex flex-col gap-1 rounded-2xl glass border-white/5 hover:bg-white/5 transition-all group"
                onClick={() => setView('invitation_config')}
              >
                <Link2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-black italic tracking-tighter text-lg">Generar Enlace de Invitación</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  (El cliente carga sus datos)
                </span>
              </Button>
            </div>
          )}

          {view === "manual" && (
            <UpsertClientForm
              onSuccess={() => {
                handleOpenChange(false);
              }}
              onCancel={() => setView('options')}
            />
          )}

          {view === "invitation_config" && (
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-[10px] font-black uppercase tracking-widest opacity-60">Nombre del Cliente (Opcional)</Label>
                <Input
                  id="client-name"
                  placeholder="Para identificarlo en la lista"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-12 glass border-white/10 rounded-xl italic font-medium focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-select" className="text-[10px] font-black uppercase tracking-widest opacity-60">Asignar Convenio (Opcional)</Label>
                <Select
                  onValueChange={(value) => setSelectedAgreementId(value === 'null' ? null : value)}
                  defaultValue="null"
                >
                  <SelectTrigger id="agreement-select" className="h-12 glass border-white/10 rounded-xl focus:ring-0 focus:ring-offset-0">
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
                <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">
                  Si asignas un convenio, el cliente podrá hacer pedidos inmediatamente después de registrarse.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleGenerateLink} disabled={isPending} className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Enlace"}
                </Button>
                <Button variant="ghost" onClick={() => setView('options')} className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] opacity-60 hover:opacity-100 italic transition-all">Volver</Button>
              </div>
            </div>
          )}

          {view === "link" && (
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Enlace de Invitación</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="h-12 glass border-white/10 rounded-xl italic font-medium text-primary"
                  />
                  <Button
                    size="icon"
                    className="h-12 w-12 shrink-0 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    onClick={copyToClipboard}
                  >
                    {hasCopied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => handleOpenChange(false)} className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">Finalizar</Button>
                <Button variant="secondary" onClick={() => setView('invitation_config')} className="h-12 glass border-white/5 rounded-xl font-black uppercase tracking-widest text-[10px] italic">Volver</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
