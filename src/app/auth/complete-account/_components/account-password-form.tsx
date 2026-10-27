"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        setErrorMessage("No se pudo guardar la contraseña. Volvé a abrir el enlace de invitación o solicitá uno nuevo al administrador.");
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
        {isPending ? "Guardando..." : "Guardar contraseña y entrar"}
      </Button>
    </form>
  );
}
