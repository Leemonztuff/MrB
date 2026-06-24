

import { getClients } from "@/app/admin/actions/clients.actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { ErrorDisplay } from "@/components/shared/error-display";
import { Users } from "lucide-react";
import { ClientsTable } from "./_components/clients-table";
import { CreateClientButton } from "./_components/create-client-button";
import { SearchClients } from "./_components/search-clients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query: queryParam } = await searchParams;
  const query = queryParam || "";
  const { data: clients, error } = await getClients(query);

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  const emptyState = (
    <EmptyState
      icon={Users}
      title="No se encontraron clientes"
      description="No hay clientes que coincidan con tu búsqueda. Intenta con otro término o crea un cliente nuevo."
    >
      <CreateClientButton />
    </EmptyState>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        description="Gestiona tus clientes, asígnales convenios y genera enlaces de alta."
      >
        <div className="flex items-center gap-2">
          <SearchClients />
          <CreateClientButton />
        </div>
      </PageHeader>
      <ClientsTable clients={clients ?? []} emptyState={emptyState} />
    </PageContainer>
  );
}
