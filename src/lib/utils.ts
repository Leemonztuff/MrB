import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-AR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
