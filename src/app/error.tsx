"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, LifeBuoy, RefreshCw } from "lucide-react";
import { Logo } from "@/app/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      <Logo showText className="mb-8" />
      <Card className="w-full max-w-lg border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 text-2xl">No pudimos cargar esta página</CardTitle>
          <CardDescription>
            Puede ser un problema momentáneo. Tu enlace de pedido sigue siendo válido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={reset} variant="brand" className="min-h-11 flex-1">
              <RefreshCw className="h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button asChild variant="outline" className="min-h-11 flex-1">
              <Link href="/ayuda">
                <LifeBuoy className="h-4 w-4" />
                Necesito ayuda
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Si el problema continúa, volvé a abrir el enlace personal que te envió Mr. Blonde o escribinos.
          </p>
          {error.digest && (
            <p className="text-center font-mono text-[10px] text-muted-foreground/60">
              Referencia: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
