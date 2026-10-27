import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { SettingsForm } from "./_components/settings-form";
import { BackupClient } from "./_components/backup-client";
import { StorageMaintenance } from "./_components/StorageMaintenance";
import { getOperatorAccounts } from "@/app/admin/actions/users.actions";
import { OperatorAccessManagement } from "./_components/operator-access-management";
import { ErrorDisplay } from "@/components/shared/error-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function SettingsPage() {
  const settings = await getSettings();
  const operatorAccounts = await getOperatorAccounts();

  return (
    <PageContainer>
      <PageHeader
        title="Configuracion"
        description="Ajusta los parametros y la apariencia de tu aplicacion."
      />

      <Accordion type="multiple" defaultValue={["general"]} className="w-full">
        <AccordionItem value="general">
          <AccordionTrigger>Ajustes Generales</AccordionTrigger>
          <AccordionContent>
            <SettingsForm settings={settings} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="backup">
          <AccordionTrigger>Backup y Restauracion</AccordionTrigger>
          <AccordionContent>
            <BackupClient />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="storage">
          <AccordionTrigger>Almacenamiento</AccordionTrigger>
          <AccordionContent>
            <StorageMaintenance />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="operators">
          <AccordionTrigger>Usuarios y operarios</AccordionTrigger>
          <AccordionContent>
            {operatorAccounts.error ? (
              <ErrorDisplay message={operatorAccounts.error.message} />
            ) : (
              <OperatorAccessManagement accounts={operatorAccounts.data ?? []} />
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </PageContainer>
  );
}
