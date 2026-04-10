"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === "destructive" 
          ? XCircle 
          : variant === "success" 
            ? CheckCircle 
            : Info;
        
        return (
          <Toast key={id} {...props} className={cn(
            variant === "destructive" && "border-red-500/50 bg-red-500/10",
            variant === "success" && "border-green-500/50 bg-green-500/10",
            props.className
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "mt-0.5 shrink-0",
                variant === "destructive" && "text-red-500",
                variant === "success" && "text-green-500",
                !variant && "text-primary"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle className="text-sm font-bold">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs opacity-90">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="h-8 w-8 rounded-full hover:bg-white/10" />
          </Toast>
        )
      })}
      <ToastViewport className="p-3 sm:p-4 gap-2 sm:gap-3" />
    </ToastProvider>
  )
}
