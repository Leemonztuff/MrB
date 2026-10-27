
import { hasUsers } from '@/app/actions/user.actions';
import { getPublicLogoUrl } from '@/app/admin/actions/settings.actions';
import { Logo } from '@/app/logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginForm } from './_components/login-form';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const usersExist = await hasUsers();
  if (!usersExist) {
    redirect('/signup');
  }

  const { data: logo_url } = await getPublicLogoUrl();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo showText={true} logoUrl={logo_url} />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            {params?.error === 'invite_expired'
              ? 'El enlace de acceso no es válido o venció. Pedile al administrador que genere uno nuevo.'
              : params?.error === 'invite_session'
                ? 'El enlace se verificó, pero no se pudo iniciar la sesión. Volvé a abrirlo o pedí un enlace nuevo.'
                : params?.error === 'invite_role'
                  ? 'No se pudo habilitar el acceso de operario. Contactá al administrador para que revise la cuenta.'
                  : 'Ingresa tus credenciales para acceder al panel.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
