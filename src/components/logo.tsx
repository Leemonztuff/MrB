
"use client";

import { cn } from "@/lib/utils";
import { Atom } from "lucide-react";

export function Logo({
  className,
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) {
  if (showText) {
    return (
        <div
        className={cn(
            "flex items-center gap-2 text-lg font-bold font-headline",
            className
        )}
        >
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Atom className="h-5 w-5" />
            </div>
            <span className={cn("font-extrabold tracking-tighter text-xl")}>
                Blonde Orders
            </span>
        </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary text-primary-foreground rounded-lg h-full w-full",
        className
      )}
    >
      <Atom className="h-5 w-5" />
    </div>
  );
}
