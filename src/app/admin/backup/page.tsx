import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { BackupClient } from "./_components/backup-client";

export default function BackupPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Backup"
        description="Exporta o restaura la configuracion completa de la aplicacion."
      />

      <BackupClient />
    </PageContainer>
  );
}
