"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PedidoError({
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
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="glass border-white/5 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="mt-4 font-black italic">Error al Cargar el Pedido</CardTitle>
          <CardDescription className="text-sm">
            {error.message || "No pudimos cargar los detalles del pedido. Por favor, intenta de nuevo."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="brand">
            <RefreshCw className="h-4 w-4" />
            Intentar de Nuevo
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
