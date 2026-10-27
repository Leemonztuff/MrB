"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateOperatorPassword } from "@/app/actions/user.actions";

type AccountPasswordFormProps = {
  mode?: "activation" | "change";
};

export function AccountPasswordForm({ mode = "activation" }: AccountPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const isChange = mode === "change";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    startTransition(async () => {
      const result = await updateOperatorPassword(password);
      if (result.error) {
        const message = result.error.message.toLowerCase().includes("sesión")
          ? "La sesión expiró. Volvé a abrir el enlace de acceso o solicitá uno nuevo al administrador."
          : result.error.message;
        setErrorMessage(message);
        return;
      }

      setPassword("");
      setConfirmPassword("");
      if (isChange) {
        toast({ title: "Contraseña actualizada", description: "Usá la nueva contraseña la próxima vez que inicies sesión." });
        router.refresh();
        return;
      }

      router.replace("/admin");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operator-password">Contraseña nueva</Label>
        <Input
          id="operator-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="operator-password-confirm">Repetir contraseña</Label>
        <Input
          id="operator-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="min-h-11"
        />
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-destructive">{errorMessage}</p>
      )}
      <Button type="submit" className="min-h-11 w-full" disabled={isPending}>
        {isPending ? "Guardando..." : isChange ? "Guardar nueva contraseña" : "Guardar contraseña y entrar"}
      </Button>
    </form>
  );
}
