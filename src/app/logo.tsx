
"use client";

import { cn } from "@/lib/utils";
import { Atom } from "lucide-react";

export function Logo({
  className,
  showText = false,
  logoUrl
}: {
  className?: string;
  showText?: boolean;
  logoUrl?: string | null;
}) {
  const textStyle: React.CSSProperties = {
    filter: 'drop-shadow(1px 2px 1px hsl(var(--primary) / 0.4))',
  };

  const IconOrLogo = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt="App Logo"
          className="h-full w-full object-contain p-1"
          loading={showText ? "eager" : "lazy"}
        />
      );
    }
    return <Atom className="h-5 w-5" />;
  };

  if (showText) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-lg font-bold font-headline",
          className
        )}
      >
        <div className="bg-primary text-primary-foreground p-1.5 rounded-md relative h-8 w-8">
          <IconOrLogo />
        </div>
        <span style={textStyle} className={cn("font-extrabold tracking-tighter text-xl text-foreground uppercase")}>
          MR. BLONDE
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-primary text-primary-foreground rounded-lg h-full w-full",
        className
      )}
    >
      <IconOrLogo />
    </div>
  );
}
