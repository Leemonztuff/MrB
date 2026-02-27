'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error caught', error, {
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center p-8 bg-background">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Error Crítico
            </h2>
            <p className="text-muted-foreground">
              Ha ocurrido un error crítico en la aplicación.
            </p>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground">
              ID de error: {error.digest}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-48">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
