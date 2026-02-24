
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

  // Si no hay sesión, la página de login se encargará de determinar
  // si debe mostrar el formulario de login o el enlace de registro.
  redirect('/login');
}
