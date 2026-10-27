"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveOperatorPin, verifyOperatorPin, lockOperatorSession } from "@/app/admin/actions/operator-pin.actions";

type OperatorPinFormProps = {
  mode: "unlock" | "setup" | "change";
};

export function OperatorPinForm({ mode }: OperatorPinFormProps) {
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const isSetting = mode !== "unlock";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = isSetting
        ? await saveOperatorPin(pin, confirmation)
        : await verifyOperatorPin(pin);
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      setPin("");
      setConfirmation("");
      if (mode === "change") {
        toast({ title: "PIN actualizado", description: "El nuevo PIN ya protege tu acceso operativo." });
        router.refresh();
        return;
      }

      router.replace("/admin");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="operator-pin">{isSetting ? "PIN nuevo" : "PIN de acceso"}</Label>
          <Input
            id="operator-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            minLength={5}
            autoComplete={mode === "unlock" ? "one-time-code" : "new-password"}
            required
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 5))}
            className="min-h-12 text-center text-xl tracking-[0.5em]"
            aria-describedby="operator-pin-help"
          />
          <p id="operator-pin-help" className="text-xs text-muted-foreground">
            Usá exactamente 5 números. Después de 5 intentos incorrectos, el acceso se pausa durante 15 minutos.
          </p>
        </div>
        {isSetting && (
          <div className="space-y-2">
            <Label htmlFor="operator-pin-confirm">Repetir PIN</Label>
            <Input
              id="operator-pin-confirm"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              minLength={5}
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={event => setConfirmation(event.target.value.replace(/\D/g, "").slice(0, 5))}
              className="min-h-12 text-center text-xl tracking-[0.5em]"
            />
          </div>
        )}
        {errorMessage && (
          <p role="alert" className="text-sm font-medium text-destructive">{errorMessage}</p>
        )}
        <Button type="submit" className="min-h-12 w-full gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {isPending
            ? "Procesando..."
            : mode === "unlock"
              ? "Desbloquear"
              : mode === "change"
                ? "Guardar nuevo PIN"
                : "Guardar PIN y continuar"}
        </Button>
      </form>

      {mode === "unlock" && (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Si olvidaste el PIN, pedile al administrador que lo restablezca. Luego podrás crear uno nuevo.
        </p>
      )}
      {mode === "change" && (
        <form action={lockOperatorSession}>
          <Button type="submit" variant="outline" className="min-h-11 w-full" disabled={isPending}>
            Bloquear este dispositivo
          </Button>
        </form>
      )}
    </div>
  );
}
