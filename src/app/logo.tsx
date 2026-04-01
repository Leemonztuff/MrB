
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Atom } from "lucide-react";

const LOGO_PLACEHOLDER_PATH = "/branding/logo-placeholder.svg";

export function Logo({
  className,
  showText = false,
  logoUrl
}: {
  className?: string;
  showText?: boolean;
  logoUrl?: string | null;
}) {
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  const textStyle: React.CSSProperties = {
    filter: 'drop-shadow(1px 2px 1px hsl(var(--primary) / 0.4))',
  };

  const IconOrLogo = () => {
    const logoSource = logoUrl ?? LOGO_PLACEHOLDER_PATH;

    if (logoSource && !logoLoadFailed) {
      return (
        <img
          src={logoSource}
          alt="App Logo"
          className="h-full w-full object-contain p-1"
          loading={showText ? "eager" : "lazy"}
          onError={() => setLogoLoadFailed(true)}
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
