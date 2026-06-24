import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <PageContainer>
      <PageHeader
        title="Configuración"
        description="Ajusta los parámetros y la apariencia de tu aplicación."
      />
      
      <SettingsForm settings={settings} />
    </PageContainer>
  );
}
