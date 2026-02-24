import { PageHeader } from "@/components/shared/page-header";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Configuración"
        description="Ajusta los parámetros y la apariencia de tu aplicación."
      />
      
      <SettingsForm settings={settings} />
    </div>
  );
}
