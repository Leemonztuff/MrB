'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signupSuperAdmin } from '@/app/actions/user.actions';
import type { AuthState } from '@/types';

const initialState: AuthState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creando cuenta...' : 'Crear Cuenta de Administrador'}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupSuperAdmin, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email de Administrador</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="admin@ejemplo.com"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Contraseña de Administrador</Label>
        <Input 
          id="password" 
          type="password" 
          name="password" 
          required
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">
          Debe tener al menos 6 caracteres.
        </p>
        {state?.error?.message && (
          <p className="text-sm text-destructive">{state.error.message}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
