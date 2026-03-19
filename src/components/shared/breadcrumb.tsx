
import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  separator?: React.ReactNode
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator = <ChevronRight className="h-4 w-4" />, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={cn("flex", className)} {...props} />
  )
)
Breadcrumb.displayName = "Breadcrumb"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbListProps {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

const BreadcrumbList = ({ items, separator }: BreadcrumbListProps) => {
  return (
    <ol className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-muted-foreground">{separator}</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-4 w-4" /> : item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  )
}

export { Breadcrumb, BreadcrumbList }
