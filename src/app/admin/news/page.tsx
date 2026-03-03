
import { Megaphone } from "lucide-react";
import { getAllNews } from "@/app/admin/actions/news.actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NewsCreateDialog } from "./_components/news-create-dialog";
import NewsTable from "./_components/news-table";

export default async function NewsPage() {
  const { data: news, error } = await getAllNews();

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  const emptyState = (
    <EmptyState
      icon={Megaphone}
      title="No hay noticias"
      description="Aún no has creado ninguna noticia para el portal."
    >
      <p className="text-sm text-muted-foreground mb-4">
        Las noticias se mostrarán en el carousel del portal del cliente.
      </p>
    </EmptyState>
  );

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Noticias"
        description="Gestión de anuncios y noticias para el portal del cliente."
      >
        <NewsCreateDialog />
      </PageHeader>

      {news && news.length > 0 ? (
        <NewsTable news={news} />
      ) : (
        emptyState
      )}
    </div>
  );
}
