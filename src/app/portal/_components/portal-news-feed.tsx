"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Loader2, Newspaper, Sparkles, Ticket } from "lucide-react";
import { getPublicNews, toggleNewsLike } from "@/app/actions/news.actions";
import type { NewsPost } from "@/types";
import { PortalEmptyState } from "@/components/shared/portal-empty-state";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { PortalNewsCardSkeleton } from "@/components/shared/portal-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs} h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function RichContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-foreground/80 prose-p:my-2 prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export function PortalNewsFeed() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLikePending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        const result = await getPublicNews();
        if (cancelled) return;

        if (!result.success) {
          setLoadError(result.error?.message || "No se pudieron cargar las novedades.");
          setNews([]);
          return;
        }

        setLoadError(null);
        setNews(result.data || []);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNews();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredNews = useMemo(() => news[0] ?? null, [news]);

  const handleLikeToggle = (newsId: string) => {
    const previous = news;
    const target = news.find((item) => item.id === newsId);
    if (!target) return;

    const nextLiked = !target.liked_by_current_client;

    setNews((current) =>
      current.map((item) =>
        item.id === newsId
          ? {
              ...item,
              liked_by_current_client: nextLiked,
              likes_count: Math.max(0, (item.likes_count ?? 0) + (nextLiked ? 1 : -1)),
            }
          : item
      )
    );

    startTransition(async () => {
      const result = await toggleNewsLike(newsId);
      if (!result.success || !result.data) {
        setNews(previous);
        return;
      }

      setNews((current) =>
        current.map((item) =>
          item.id === newsId
            ? {
                ...item,
                liked_by_current_client: result.data?.liked,
                likes_count: result.data?.likes_count ?? item.likes_count ?? 0,
              }
            : item
        )
      );
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PortalPageHeader
        icon={Newspaper}
        title="Novedades"
        description="Un feed con lanzamientos, promos y novedades del catalogo."
      />

      {featuredNews && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div className="space-y-2 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                Destacado
              </p>
              <h2 className="max-w-xl text-xl sm:text-2xl font-black italic uppercase tracking-tight text-foreground truncate sm:truncate-none">
                {featuredNews.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {relativeDate(featuredNews.created_at)}
              </p>
            </div>
            {featuredNews.promotion_id ? (
              <Button asChild className="rounded-xl font-black uppercase tracking-wider text-xs sm:text-sm py-2.5 sm:py-2 min-h-[44px]">
                <Link href={`/portal/catalogo?newsId=${featuredNews.id}&promoId=${featuredNews.promotion_id}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Ver promo
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-6">
          <PortalNewsCardSkeleton />
          <PortalNewsCardSkeleton />
          <PortalNewsCardSkeleton />
        </div>
      ) : loadError ? (
        <PortalEmptyState
          icon={Sparkles}
          title="No se pudieron cargar las novedades"
          description={loadError}
        />
      ) : news.length === 0 ? (
        <PortalEmptyState
          icon={Sparkles}
          title="Sin novedades"
          description="Todavia no hay publicaciones activas para mostrar."
        />
      ) : (
          <div className="space-y-6">
          {news.map((item) => {
            return (
              <Card key={item.id} className="overflow-hidden border-white/10 bg-card/95 shadow-xl mx-2 sm:mx-0">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-white/5 px-3 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/40 text-xs sm:text-sm font-black uppercase text-primary-foreground shadow-lg">
                        MB
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black uppercase tracking-wide text-foreground">
                          Mr. Blonde
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                          {relativeDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    {item.promotion_id ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        Promo
                      </span>
                    ) : null}
                  </div>

                  {item.image_url ? (
                    <div className="relative aspect-[4/5] sm:aspect-video w-full overflow-hidden bg-muted/30">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-4 px-4 py-4 sm:py-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => handleLikeToggle(item.id)}
                        disabled={isLikePending}
                        className={cn(
                          "inline-flex items-center gap-2 sm:gap-2.5 rounded-full border px-4 py-2.5 sm:py-2 text-sm font-bold transition-colors min-h-[44px] touch-manipulation",
                          item.liked_by_current_client
                            ? "border-red-500/30 bg-red-500/10 text-red-500"
                            : "border-white/10 bg-background text-foreground hover:border-primary/30 hover:text-primary"
                        )}
                        aria-pressed={item.liked_by_current_client}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            item.liked_by_current_client && "fill-current"
                          )}
                        />
                        <span className="hidden xs:inline">Me gusta</span>
                      </button>
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.likes_count ?? 0}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <RichContent content={item.content} />
                    </div>

                    {item.promotion_id ? (
                      <div className="border-t border-white/5 pt-4">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full rounded-xl border-primary/20 font-black uppercase tracking-wider sm:w-auto"
                        >
                          <Link href={`/portal/catalogo?newsId=${item.id}&promoId=${item.promotion_id}`}>
                            <Ticket className="mr-2 h-4 w-4" />
                            Ver en catalogo
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
