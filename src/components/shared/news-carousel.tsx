"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import type { NewsPost } from "@/types";

interface NewsCarouselProps {
  news: NewsPost[];
}

function RichContent({ content }: { content: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p className="text-sm text-muted-foreground line-clamp-2">{content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...</p>;
  }

  return (
    <div
      className="text-sm text-muted-foreground prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:my-2 prose-headings:font-black prose-headings:italic prose-headings:tracking-tight"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export function NewsCarousel({ news }: NewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNews, setSelectedNews] = useState<NewsPost | null>(null);

  if (!news || news.length === 0) {
    return null;
  }

  if (news.length === 1) {
    const item = news[0];
    return (
      <>
        <Card
          className="glass-card group border-white/5 overflow-hidden cursor-pointer hover:border-primary/20 transition-all hover:shadow-primary/5 shadow-2xl"
          onClick={() => setSelectedNews(item)}
        >
          <div className="flex">
            {item.image_url && (
              <div className="relative w-32 h-24 sm:w-48 sm:h-32 shrink-0 overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <CardContent className="p-4 flex flex-col justify-center">
              <h3 className="font-black italic text-lg tracking-tight mb-1 uppercase group-hover:text-primary transition-colors">{item.title}</h3>
              <RichContent content={item.content} />
            </CardContent>
          </div>
        </Card>

        <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogClose className="absolute right-4 top-4" />
            {selectedNews?.image_url && (
              <div className="relative w-full h-48 sm:h-64 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={selectedNews.image_url}
                  alt={selectedNews.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h2 className="text-2xl font-black italic tracking-tight">{selectedNews?.title}</h2>
            <div className="mt-4">
              <RichContent content={selectedNews?.content || ""} />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? news.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === news.length - 1 ? 0 : prev + 1));
  };

  const currentItem = news[currentIndex];

  return (
    <>
      <div className="relative">
        <Card
          className="glass-card group border-white/5 overflow-hidden cursor-pointer hover:border-primary/20 transition-all hover:shadow-primary/5 shadow-2xl"
          onClick={() => setSelectedNews(currentItem)}
        >
          <div className="flex">
            {currentItem.image_url && (
              <div className="relative w-32 h-24 sm:w-48 sm:h-32 shrink-0 overflow-hidden">
                <Image
                  src={currentItem.image_url}
                  alt={currentItem.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <CardContent className="p-4 flex flex-col justify-center flex-1">
              <h3 className="font-black italic text-lg tracking-tight mb-1 uppercase group-hover:text-primary transition-colors">{currentItem.title}</h3>
              <RichContent content={currentItem.content} />
            </CardContent>
          </div>
        </Card>

        {news.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-primary/80 backdrop-blur-md text-white border border-white/10 rounded-xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/40 hover:bg-primary/80 backdrop-blur-md text-white border border-white/10 rounded-xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex justify-center gap-2 mt-3">
              {news.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogClose className="absolute right-4 top-4" />
          {selectedNews?.image_url && (
            <div className="relative w-full h-48 sm:h-64 mb-4 rounded-lg overflow-hidden">
              <Image
                src={selectedNews.image_url}
                alt={selectedNews.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h2 className="text-2xl font-black italic tracking-tight">{selectedNews?.title}</h2>
          <div className="mt-4">
            <RichContent content={selectedNews?.content || ""} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
