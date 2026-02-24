
"use client";

import { cn } from "@/lib/utils";
import { Atom } from "lucide-react";
import Image from 'next/image';

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
    filter: 'drop-shadow(1px 2px 1px hsl(41 47% 57% / 0.7))',
    color: '#FFFFFF'
  };

  const IconOrLogo = () => {
    if (logoUrl) {
      // Using fill and object-contain makes the logo "smart" and "adaptable".
      // It will scale down to fit the container while maintaining its aspect ratio,
      // without being cropped, regardless of the original image's dimensions.
      return <Image src={logoUrl} alt="App Logo" fill className="object-contain p-1" />;
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
            <span style={textStyle} className={cn("font-extrabold tracking-tighter text-xl")}>
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
