"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Copy, Link2, Loader2, UserPlus } from "lucide-react";
import { createClientForInvitation } from "@/app/admin/actions/clients.actions";
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import type { Agreement } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UpsertClientForm } from "./upsert-client-form";

type View = "options" | "manual" | "invite";
type InviteStep = 0 | 1 | 2;

const inviteSteps = [
  { id: 0, title: "Identidad", description: "Como queres identificarlo en tu lista." },
  { id: 1, title: "Convenio", description: "Defini si queres dejarlo listo para comprar." },
  { id: 2, title: "Compartir", description: "Copia y envia el enlace al cliente." },
] as const;

export function CreateClientDialog({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("options");
  const [inviteStep, setInviteStep] = useState<InviteStep>(0);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (view === "invite" && agreements.length === 0) {
      getAgreements().then(({ data }) => setAgreements(data ?? []));
    }
  }, [agreements.length, view]);

  const inviteSummary = useMemo(() => {
    const agreementName = agreements.find(agreement => agreement.id === selectedAgreementId)?.agreement_name;
    return {
      clientName: clientName.trim() || "Cliente pendiente",
      agreementName: agreementName || "Sin convenio inicial",
    };
  }, [agreements, clientName, selectedAgreementId]);

  const resetState = () => {
    setView("options");
    setInviteStep(0);
    setGeneratedLink("");
    setInviteError(null);
    setHasCopied(false);
    setClientName("");
    setSelectedAgreementId(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(resetState, 200);
    }
  };

  const handleGenerateLink = () => {
    startTransition(async () => {
      setInviteError(null);
      try {
        const result = await createClientForInvitation({
          name: clientName || null,
          agreementId: selectedAgreementId,
        });

        if (result.error || !result.data) {
          const message = result.error?.message || "No se pudo generar el enlace.";
          setInviteError(message);
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
          return;
        }

        const origin = window.location.origin;
        setGeneratedLink(`${origin}/onboarding/${result.data.onboarding_token}`);
        setInviteStep(2);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo generar el enlace.";
        setInviteError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
    toast({ title: "Enlace de invitacion copiado" });
  };

  const renderOptions = () => (
    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <button
        type="button"
        onClick={() => setView("manual")}
        className="group rounded-3xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/40 hover:bg-accent/30"
      >
        <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <UserPlus className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black tracking-tight">Carga manual guiada</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea el cliente paso a paso y completa toda la informacion desde el admin.
        </p>
      </button>

      <button
        type="button"
        onClick={() => setView("invite")}
        className="group rounded-3xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/40 hover:bg-accent/30"
      >
        <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Link2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black tracking-tight">Invitacion por enlace</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Genera un link corto y deja que el cliente complete su propia alta.
        </p>
      </button>
    </div>
  );

  const renderInviteStepper = () => (
    <div className="border-b border-border/60 px-5 pb-4 sm:px-6">
      <div className="grid grid-cols-3 gap-2">
        {inviteSteps.map(step => {
          const isActive = step.id === inviteStep;
          const isCompleted = step.id < inviteStep;

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                isActive && "border-primary bg-primary/10",
                isCompleted && "border-primary/30 bg-primary/5",
                !isActive && !isCompleted && "border-border/60 bg-muted/30"
              )}
            >
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                Paso {step.id + 1}
              </div>
              <div className="text-sm font-bold">{step.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInviteContent = () => (
    <>
      {renderInviteStepper()}
      <div className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-6 p-5 sm:p-6">
            {inviteStep === 0 ? (
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Como queres identificar al cliente</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Este nombre es opcional y solo te ayuda a encontrarlo mas rapido antes de que complete el alta.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Nombre interno
                  </Label>
                  <Input
                    id="client-name"
                    placeholder="Ej: Barberia Central"
                    value={clientName}
                    onChange={event => setClientName(event.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </section>
            ) : null}

            {inviteStep === 1 ? (
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Defini el punto de partida</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Si le asignas un convenio, el cliente podra entrar y comprar apenas termine su onboarding.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agreement-select" className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Convenio inicial
                  </Label>
                  <Select
                    onValueChange={value => setSelectedAgreementId(value === "__none__" ? null : value)}
                    value={selectedAgreementId ?? "__none__"}
                  >
                    <SelectTrigger id="agreement-select" className="h-12 rounded-2xl">
                      <SelectValue placeholder="Selecciona un convenio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin convenio por ahora</SelectItem>
                      {agreements.map(agreement => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.agreement_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Resumen
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="font-semibold">Cliente:</span> {inviteSummary.clientName}</p>
                    <p><span className="font-semibold">Convenio:</span> {inviteSummary.agreementName}</p>
                  </div>
                </div>

                {inviteError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {inviteError}
                  </div>
                ) : null}
              </section>
            ) : null}

            {inviteStep === 2 ? (
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Enlace listo para compartir</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Copialo y enviaselo al cliente. Cuando complete el formulario, el alta seguira el flujo configurado.
                  </p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Cliente
                  </div>
                  <p className="mt-2 text-sm font-semibold">{inviteSummary.clientName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    Enlace de invitacion
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input value={generatedLink} readOnly className="h-12 rounded-2xl sm:flex-1" />
                    <Button type="button" onClick={copyToClipboard} className="h-12 rounded-2xl px-5 sm:w-auto">
                      {hasCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {hasCopied ? "Copiado" : "Copiar enlace"}
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <div className="border-t border-border/60 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={() => {
                if (inviteStep === 0) {
                  setView("options");
                  return;
                }
                setInviteStep(current => (Math.max(0, current - 1) as InviteStep));
              }}
            >
              Volver
            </Button>

            {inviteStep < 2 ? (
              <Button
                type="button"
                className="h-11 rounded-2xl"
                disabled={isPending}
                onClick={() => {
                  if (inviteStep === 1) {
                    handleGenerateLink();
                    return;
                  }
                  setInviteStep(1);
                }}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {inviteStep === 1 ? "Generar enlace" : "Continuar"}
              </Button>
            ) : (
              <Button type="button" className="h-11 rounded-2xl" onClick={() => handleOpenChange(false)}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[min(92vh,860px)] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
          <DialogTitle className="text-2xl font-black tracking-tight">Alta de clientes</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm">
            Usa un flujo guiado para crear clientes manualmente o generar invitaciones sin cargar de mas la pantalla.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {view === "options" ? renderOptions() : null}

          {view === "manual" ? (
            <UpsertClientForm
              onSuccess={() => handleOpenChange(false)}
              onCancel={() => setView("options")}
            />
          ) : null}

          {view === "invite" ? renderInviteContent() : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
