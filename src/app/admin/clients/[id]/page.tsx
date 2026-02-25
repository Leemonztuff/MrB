
import { Suspense } from "react";
import Link from "next/link";
import { FileWarning } from "lucide-react";
import { getClientById, getClientStats } from "@/app/admin/actions/clients.actions";
import { getClientOrders } from "@/app/admin/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ClientDetailsLoader = dynamic(
  () => import('./_components/client-details-client'),
  {
    loading: () => <ClientDetailsSkeleton />,
  }
);

function ClientDetailsSkeleton() {
  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 md:gap-8">
        <Skeleton className="h-96 md:col-span-2" />
        <Skeleton className="h-96 md:col-span-1" />
      </div>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [clientResult, statsResult, ordersResult] = await Promise.all([
    getClientById(id),
    getClientStats(id),
    getClientOrders(id)
  ]);

  if (clientResult.error || !clientResult.data) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <FileWarning className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-2xl font-bold tracking-tight">
            Cliente no encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            No se pudo encontrar el cliente solicitado o ocurrió un error.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/clients">Volver a Clientes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const client = clientResult.data;
  const stats = statsResult.data ?? null;
  const orders = ordersResult;

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <Suspense fallback={<ClientDetailsSkeleton />}>
        <ClientDetailsLoader
          client={client}
          stats={stats}
          orders={orders}
        />
      </Suspense>
    </div>
  );
}
