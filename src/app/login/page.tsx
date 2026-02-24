
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

export default async function LoginPage() {
  const usersExist = await hasUsers();
  if (!usersExist) {
    redirect('/signup');
  }

  const logo_url = await getPublicLogoUrl();

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo showText={true} logoUrl={logo_url} />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
