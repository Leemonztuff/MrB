"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11 flex-1"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </Button>
  );
}
