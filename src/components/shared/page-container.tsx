import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
};

export function PageContainer({ children, className, gap = "md" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "grid flex-1 items-start",
        gap === "sm" && "gap-4 md:gap-6",
        gap === "md" && "gap-4 md:gap-8",
        gap === "lg" && "gap-6 md:gap-10 pb-10",
        className
      )}
    >
      {children}
    </div>
  );
}
