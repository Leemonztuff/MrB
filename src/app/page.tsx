
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si hay una sesión activa, ir directamente al panel de administración.
  if (session) {
    redirect('/admin');
  }

  // Los clientes no deben ver el login del panel: los derivamos a la
  // pantalla pública de ayuda, que explica cómo volver a su pedido.
  redirect('/ayuda');
}
