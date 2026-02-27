import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
