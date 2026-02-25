
import { getAgreements } from "@/app/admin/actions/agreements.actions";
import AgreementsTable from "./_components/agreements-table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "../_components/entity-dialog";
import { agreementFormConfig } from "./_components/form-config";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AgreementsPage() {
  const { data: agreements, error } = await getAgreements();

  if (error) {
    // TODO: Add a better error component
    return <p className="text-destructive">{error.message}</p>;
  }

  const emptyState = (
    <EmptyState
      icon={FileText}
      title="No hay convenios creados"
      description="Crea tu primer convenio para empezar a definir reglas de precios y promociones para tus clientes."
    >
      <EntityDialog formConfig={agreementFormConfig}>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Convenio
        </Button>
      </EntityDialog>
    </EmptyState>
  );

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Convenios"
        description="Reglas dinámicas y enlaces de pedido."
      >
        <EntityDialog formConfig={agreementFormConfig}>
          <Button size="sm" className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
              Agregar Convenio
            </span>
          </Button>
        </EntityDialog>
      </PageHeader>
      <TooltipProvider>
        <AgreementsTable agreements={agreements ?? []} emptyState={emptyState} />
      </TooltipProvider>
    </div>
  );
}
