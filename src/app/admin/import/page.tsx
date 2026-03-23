
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizardPage } from "./_components/import-wizard-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importar - Mr. Blonde Admin",
  description: "Importar datos desde archivos Excel o CSV",
};

export default function ImportPage() {
  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Importar datos"
        description="Importa productos, clientes o listas de precios desde archivos Excel o CSV."
      />
      <ImportWizardPage />
    </div>
  );
}
