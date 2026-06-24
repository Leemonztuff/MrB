import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type ErrorDisplayProps = {
  title?: string;
  message: string;
  className?: string;
};

export function ErrorDisplay({
  title = "Error",
  message,
  className,
}: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={cn("rounded-xl", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-black italic">{title}</AlertTitle>
      <AlertDescription className="text-sm">{message}</AlertDescription>
    </Alert>
  );
}
