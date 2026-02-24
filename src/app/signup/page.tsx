
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
import { SignupForm } from './_components/signup-form';
import { redirect } from 'next/navigation';

export default async function SignupPage() {
  const usersExist = await hasUsers();
  if (usersExist) {
    redirect('/login');
  }

  const logo_url = await getPublicLogoUrl();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo showText={true} logoUrl={logo_url} />
          </div>
          <CardTitle className="text-2xl">Crear Cuenta de Administrador</CardTitle>
          <CardDescription>
            Este es un paso único para configurar el super-administrador del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
