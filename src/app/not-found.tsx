import Link from "next/link";
import { LifeBuoy, SearchX } from "lucide-react";
import { Logo } from "@/app/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4 sm:p-8">
      <Logo showText className="mb-8" />
      <Card className="w-full max-w-lg border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SearchX className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 text-2xl">No encontramos esta página</CardTitle>
          <CardDescription>
            El enlace puede estar incompleto o haber cambiado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Si estabas entrando a tu catálogo, volvé a abrir el enlace personal que te envió Mr. Blonde.
          </p>
          <Button asChild variant="brand" className="min-h-11 w-full">
            <Link href="/ayuda">
              <LifeBuoy className="h-4 w-4" />
              Ir a Ayuda
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
