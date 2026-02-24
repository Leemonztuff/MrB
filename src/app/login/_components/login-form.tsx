'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/app/actions/user.actions';
import type { AuthState } from '@/types';

const initialState: AuthState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Accediendo...' : 'Acceder'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input 
            id="email" 
            type="email" 
            name="email"
            placeholder="admin@ejemplo.com" 
            required 
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input 
            id="password" 
            type="password" 
            name="password" 
            required 
        />
      </div>
        {state?.error?.message && (
          <p className="text-sm text-destructive text-center pt-2">{state.error.message}</p>
        )}
      <SubmitButton />
    </form>
  );
}
