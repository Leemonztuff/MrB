'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublicNews } from '@/app/actions/news.actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Ticket, Clock, Newspaper, Sparkles } from 'lucide-react';
import type { NewsPost } from '@/types';

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
  if (diffDays < 7) return `Hace ${diffDays} días`;
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

function NewsCardSkeleton() {
  return (
    <div className="glass-card animate-pulse">
      <div className="w-full aspect-[16/9] bg-muted/50" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-24 bg-muted/50 rounded" />
        <div className="h-5 w-3/4 bg-muted/50 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted/50 rounded" />
          <div className="h-3 w-5/6 bg-muted/50 rounded" />
        </div>
      </div>
    </div>
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Newspaper className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
            Novedades
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Lo último de Mr. Blonde
          </p>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-6">
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </div>
      ) : news.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-black italic text-lg tracking-tight uppercase mb-2">
            Sin novedades por ahora
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Estamos preparando noticias increíbles para vos. ¡Volvé pronto!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {news.map((item, idx) => (
            <article
              key={item.id}
              className={cn(
                "glass-card group overflow-hidden fade-in-up",
                `animation-delay-${Math.min((idx + 1) * 100, 500)}`
              )}
              style={{ animationFillMode: 'both' }}
            >
              {/* Hero Image */}
              {item.image_url && (
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted/30">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover transition-opacity duration-200"
                    sizes="(max-width: 672px) 100vw, 672px"
                  />
                  {/* Gradient overlay at bottom for readability */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Promotion badge over image */}
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

              {/* Content */}
              <div className="p-5">
                {/* Meta row */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs italic shrink-0">
                    MB
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/70 leading-none">
                      Mr. Blonde
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {relativeDate(item.created_at)}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-black italic text-lg md:text-xl tracking-tight mb-3 uppercase leading-tight text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>

                {/* Body */}
                <RichContent content={item.content} />

                {/* Promotion CTA */}
                {item.promotion_id && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <Button
                      asChild
                      className="w-full sm:w-auto bg-primary text-primary-foreground font-black uppercase tracking-tighter rounded-xl px-6 h-11 shadow-lg shadow-primary/20"
                    >
                      <Link href={`/portal/catalogo?newsId=${item.id}&promoId=${item.promotion_id}`}>
                        <Ticket className="h-4 w-4 mr-2" />
                        Ver Promoción
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
