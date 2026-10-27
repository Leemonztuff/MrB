import { redirect } from "next/navigation";
import { Logo } from "@/app/logo";
import { getOperatorPinStatus } from "@/app/admin/actions/operator-pin.actions";
import { ErrorDisplay } from "@/components/shared/error-display";
import { getCurrentAppRole } from "@/app/admin/actions/_helpers";
import { OperatorPinForm } from "./_components/operator-pin-form";
import { isCurrentOperatorPinSessionUnlocked } from "@/lib/operator-pin-server";

export default async function OperatorUnlockPage() {
  const role = await getCurrentAppRole();
  if (role !== "operario") redirect("/admin");
  if (await isCurrentOperatorPinSessionUnlocked()) redirect("/admin");

  const { data, error } = await getOperatorPinStatus();
  if (error || !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <ErrorDisplay message={error?.message ?? "No se pudo consultar el estado del PIN."} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Logo showText />
          </div>
          <h1 className="text-2xl font-semibold">
            {data.configured ? "Desbloquear acceso" : "Configurar tu PIN"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.configured
              ? "Ingresá tu PIN de 5 dígitos para continuar con los pedidos."
              : "Creá un PIN de 5 dígitos para proteger el acceso operativo en este dispositivo."}
          </p>
        </div>
        <OperatorPinForm mode={data.configured ? "unlock" : "setup"} />
      </section>
    </main>
  );
}
