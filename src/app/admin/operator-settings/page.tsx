import { redirect } from "next/navigation";
import { getCurrentAppRole } from "@/app/admin/actions/_helpers";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { OperatorPinForm } from "@/app/operator/unlock/_components/operator-pin-form";
import { AccountPasswordForm } from "@/app/auth/complete-account/_components/account-password-form";

export default async function OperatorSettingsPage() {
  const role = await getCurrentAppRole();
  if (role !== "operario") redirect("/admin");

  return (
    <PageContainer>
      <PageHeader
        title="Mi acceso"
        description="Administrá tu contraseña y el PIN que desbloquea tus tareas en este dispositivo."
      />
      <div className="w-full max-w-xl space-y-4">
        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Cambiar contraseña</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              La contraseña se usa para iniciar sesión en un dispositivo nuevo.
            </p>
          </div>
          <AccountPasswordForm mode="change" />
        </section>
        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="font-semibold">Cambiar PIN</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              El PIN protege el acceso operativo en este dispositivo.
            </p>
          </div>
          <OperatorPinForm mode="change" />
        </section>
      </div>
    </PageContainer>
  );
}
