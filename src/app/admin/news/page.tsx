
import { Megaphone, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllNews } from "@/app/admin/actions/news.actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { NewsForm } from "./_components/news-form";
import { revalidatePath } from "next/cache";
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
        <DialogCreateNews />
      </PageHeader>

      {news && news.length > 0 ? (
        <NewsTable 
          news={news} 
          onRefresh={() => revalidatePath("/admin/news")} 
        />
      ) : (
        emptyState
      )}
    </div>
  );
}

function DialogCreateNews() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="h-10 gap-2 font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap italic">
            Nueva Noticia
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva noticia</DialogTitle>
          <DialogDescription>
            Crea una nueva noticia para el portal del cliente.
          </DialogDescription>
        </DialogHeader>
        <NewsForm
          onSuccess={() => revalidatePath("/admin/news")}
        />
      </DialogContent>
    </Dialog>
  );
}
