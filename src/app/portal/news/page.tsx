'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicNews } from '@/app/actions/news.actions';
import { Button } from '@/components/ui/button';
import { Ticket, Clock, Newspaper, Sparkles } from 'lucide-react';
import type { NewsPost } from '@/types';
import { PortalPageHeader } from '@/components/shared/portal-page-header';
import { PortalEmptyState } from '@/components/shared/portal-empty-state';
import { PortalNewsCardSkeleton } from '@/components/shared/portal-skeleton';
import { Card } from '@/components/ui/card';

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Justo ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function RichContent({ content }: { content: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <p className="text-sm text-muted-foreground line-clamp-3">
        {content.replace(/<[^>]*>?/gm, '').substring(0, 200)}...
      </p>
    );
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1.5 prose-headings:font-black prose-headings:italic prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline text-foreground/80"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNews().then(res => {
      if (res.data) setNews(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PortalPageHeader
        icon={Newspaper}
        title="Novedades"
        description="Lo ultimo de Mr. Blonde"
      />

      {loading ? (
        <div className="space-y-6">
          <PortalNewsCardSkeleton />
          <PortalNewsCardSkeleton />
          <PortalNewsCardSkeleton />
        </div>
      ) : news.length === 0 ? (
        <PortalEmptyState
          icon={Sparkles}
          title="Sin novedades"
          description="Vuelve pronto para ver las ultimas noticias y promociones."
        />
      ) : (
        <div className="space-y-6">
          {news.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-dashed fade-in-up"
              style={{ animationFillMode: 'both' }}
            >
              {item.image_url && (
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted/30">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover transition-opacity duration-200"
                    sizes="(max-width: 672px) 100vw, 672px"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  {item.promotion_id && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30">
                        <Ticket className="h-3 w-3" />
                        Promo
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    {relativeDate(item.created_at)}
                  </span>
                </div>

                <h2 className="text-xl font-black italic tracking-tight uppercase mb-3">
                  {item.title}
                </h2>

                <RichContent content={item.content} />

                {item.promotion_id && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <Button
                      asChild
                      className="w-full sm:w-auto bg-primary text-primary-foreground font-black uppercase tracking-tighter rounded-xl px-6 h-11 shadow-lg shadow-primary/20"
                    >
                      <Link href={`/portal/catalogo?newsId=${item.id}&promoId=${item.promotion_id}`}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Ver Promocion
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
