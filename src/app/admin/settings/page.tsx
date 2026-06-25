import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { SettingsForm } from "./_components/settings-form";
import { BackupClient } from "./_components/backup-client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function SettingsPage() {
  const settings = await getSettings();

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
      </Accordion>
    </PageContainer>
  );
}
