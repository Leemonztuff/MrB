

import { getClients } from "@/app/admin/actions/clients.actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { ClientsTable } from "./_components/clients-table";
import { CreateClientButton } from "./_components/create-client-button";
import { SearchClients } from "./_components/search-clients";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || "";
  const { data: clients, error } = await getClients(query);

  if (error) {
    // TODO: Add a better error component
    return <p className="text-destructive">{error.message}</p>;
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
    <div className="grid flex-1 items-start gap-4 md:gap-8">
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
    </div>
  );
}
