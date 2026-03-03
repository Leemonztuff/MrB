"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConfirmationButton({ orderId }: { orderId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pedido/confirmar/${orderId}`);
            if (response.ok) {
                // The API redirects to the same page with success=true
                router.push(`/pedido/confirmar/${orderId}?success=true`);
                router.refresh();
            } else {
                alert("Error al confirmar el pedido. Por favor intenta de nuevo.");
            }
        } catch (error) {
            console.error("Confirmation error:", error);
            alert("Error de conexión. Por favor revisa tu internet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConfirm}
            disabled={loading}
            size="lg"
            className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 gap-3 group transition-all"
        >
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <>
                    <PackageCheck className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    Confirmar Recepción
                </>
            )}
        </Button>
    );
}
