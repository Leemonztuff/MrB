"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Mail, ShieldCheck, UserRoundX, UserRoundCheck } from "lucide-react";
import { inviteOperator, resetOperatorPin, setOperatorAccess, type OperatorAccount } from "@/app/admin/actions/users.actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function OperatorAccessManagement({ accounts }: { accounts: OperatorAccount[] }) {
  const [email, setEmail] = useState("");
  const [accountToReset, setAccountToReset] = useState<OperatorAccount | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await inviteOperator(email);
      if (result.error) {
        toast({
          title: "No se pudo enviar la invitación",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Invitación enviada",
        description: `Se envió un enlace para configurar el acceso de ${result.data?.email}.`,
      });
      setEmail("");
      router.refresh();
    });
  };

  const handleAccessChange = (account: OperatorAccount, enabled: boolean) => {
    startTransition(async () => {
      const result = await setOperatorAccess(account.id, enabled);
      if (result.error) {
        toast({
          title: "No se pudo cambiar el acceso",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: enabled ? "Acceso habilitado" : "Acceso pausado",
        description: account.email,
      });
      router.refresh();
    });
  };

  const handleResetPin = () => {
    if (!accountToReset) return;
    startTransition(async () => {
      const result = await resetOperatorPin(accountToReset.id);
      if (result.error) {
        toast({
          title: "No se pudo restablecer el PIN",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "PIN restablecido",
        description: `${accountToReset.email} deberá configurar un PIN nuevo en el próximo acceso.`,
      });
      setAccountToReset(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">Acceso de operarios</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Pueden ver pedidos, avanzar el flujo operativo y configurar su PIN desde «Mi acceso». No acceden a la gestión comercial ni a la configuración administrativa.
            </p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="operator-email">Correo electrónico</Label>
            <Input
              id="operator-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="operario@empresa.com"
              className="min-h-11"
            />
          </div>
          <Button type="submit" disabled={isPending} className="min-h-11 gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar invitación
          </Button>
        </form>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          La persona recibirá un enlace para definir su contraseña. El envío requiere que el correo y la URL de retorno estén configurados en Supabase.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Cuentas de operario</h3>
          <Badge variant="secondary">{accounts.length}</Badge>
        </div>
        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">Todavía no hay operarios</p>
            <p className="mt-1 text-sm text-muted-foreground">Enviá una invitación para habilitar el acceso operativo.</p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border">
            {accounts.map((account) => {
              const isDisabled = account.bannedUntil && new Date(account.bannedUntil).getTime() > Date.now();
              const isPendingInvite = !account.confirmedAt;
              return (
                <li key={account.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all font-medium">{account.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={isDisabled ? "destructive" : isPendingInvite ? "outline" : "secondary"}>
                        {isDisabled ? "Acceso pausado" : isPendingInvite ? "Invitación pendiente" : "Activo"}
                      </Badge>
                      {account.lastSignInAt && (
                        <span>Último acceso {new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(new Date(account.lastSignInAt))}</span>
                      )}
                    </div>
                  </div>
                  {!isPendingInvite && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="min-h-11 gap-2"
                        disabled={isPending}
                        onClick={() => setAccountToReset(account)}
                      >
                        <KeyRound className="h-4 w-4" />
                        Restablecer PIN
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isDisabled ? "outline" : "ghost"}
                        className="min-h-11 gap-2"
                        disabled={isPending}
                        onClick={() => handleAccessChange(account, Boolean(isDisabled))}
                      >
                        {isDisabled
                          ? <UserRoundCheck className="h-4 w-4" />
                          : <UserRoundX className="h-4 w-4" />}
                        {isDisabled ? "Habilitar" : "Pausar acceso"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={Boolean(accountToReset)} onOpenChange={open => !open && setAccountToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer el PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              {accountToReset?.email} deberá configurar un PIN nuevo para volver a abrir el panel operativo. Su contraseña de inicio de sesión no cambiará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPin} disabled={isPending}>
              Restablecer PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
