
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Loader2 } from "lucide-react";
import { ClientsTable } from "./_components/clients-table";
import { CreateClientButton } from "./_components/create-client-button";
import { SearchClients } from "./_components/search-clients";
import { ImportClientsButton } from "./_components/import-clients-button";
import { Pagination } from "@/components/shared/pagination";
import type { Client } from "@/types";
import { getClients } from "@/app/admin/actions/clients.actions";

const PAGE_SIZE = 20;

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback((searchQuery: string, currentPage: number) => {
    startTransition(async () => {
      setError(null);
      const result = await getClients(searchQuery, currentPage, pageSize);
      
      if (result.error) {
        setError(result.error.message);
        return;
      }
      
      setClients(result.data?.clients || []);
      setTotal(result.data?.total || 0);
      setTotalPages(result.data?.totalPages || 0);
    });
  }, [pageSize]);

  useEffect(() => {
    fetchClients(query, page);
  }, [query, page, pageSize, fetchClients]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const emptyState = (
    <EmptyState
      icon={Users}
      title="No se encontraron clientes"
      description={query ? `No hay clientes que coincidan con "${query}". Intenta con otro término o crea un cliente nuevo.` : "No hay clientes registrados. ¡Crea el primero!"}
    >
      <CreateClientButton />
    </EmptyState>
  );

  if (error) {
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8">
        <PageHeader
          title="Clientes"
          description="Gestiona tus clientes, asígnales convenios y genera enlaces de alta."
        >
          <div className="flex items-center gap-2">
            <SearchClients />
            <ImportClientsButton />
            <CreateClientButton />
          </div>
        </PageHeader>
        <div className="text-destructive p-4 rounded-lg border border-destructive/20 bg-destructive/10">
          <p className="font-medium">Error al cargar clientes</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Clientes"
        description="Gestiona tus clientes, asígnales convenios y genera enlaces de alta."
      >
        <div className="flex items-center gap-2">
          <SearchClients />
          <ImportClientsButton />
          <CreateClientButton />
        </div>
      </PageHeader>
      
      {isLoading && clients.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <ClientsTable clients={clients} emptyState={emptyState} />
          
          {clients.length > 0 && (
            <div className="bg-card rounded-lg border">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
