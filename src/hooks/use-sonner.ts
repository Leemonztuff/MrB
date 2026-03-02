
"use client"

import { toast as sonnerToast } from "sonner"

type ToastOptions = {
  description?: string
  variant?: "default" | "destructive"
}

export function useSonner() {
  const toast = ({ title, description, variant = "default" }: ToastOptions & { title: string }) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
      })
    } else {
      sonnerToast.success(title, {
        description,
      })
    }
  }

  return { toast }
}
