import { redirect } from "next/navigation";
import { getCurrentAppRole } from "@/app/admin/actions/_helpers";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { OperatorPinForm } from "@/app/operator/unlock/_components/operator-pin-form";

export default async function OperatorSettingsPage() {
  const role = await getCurrentAppRole();
  if (role !== "operario") redirect("/admin");

  return (
    <PageContainer>
      <PageHeader
        title="Mi acceso"
        description="Cambiá el PIN que usás para desbloquear tus tareas en este dispositivo."
      />
      <section className="w-full max-w-xl space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Cambiar PIN</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tu contraseña sigue siendo necesaria para iniciar sesión en un dispositivo nuevo.
          </p>
        </div>
        <OperatorPinForm mode="change" />
      </section>
    </PageContainer>
  );
}
