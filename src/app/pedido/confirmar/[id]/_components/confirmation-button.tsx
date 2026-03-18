"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackageCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConfirmationButton({ orderId }: { orderId: string }) {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        if (token.length < 4) return; // Allow 4-6 characters if necessary, but typically 6

        setLoading(true);
        try {
            const response = await fetch(`/api/pedido/confirmar/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            if (response.ok) {
                router.push(`/pedido/confirmar/${orderId}?success=true`);
                router.refresh();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Error al confirmar el pedido. Por favor verifica tu PIN.");
            }
        } catch (error) {
            console.error("Confirmation error:", error);
            alert("Error de conexión. Por favor revisa tu internet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    PIN DE SEGURIDAD (TOKEN)
                </label>
                <input
                    type="text"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-14 bg-white/5 border-white/10 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:opacity-20"
                />
                <p className="text-[9px] text-center text-muted-foreground italic">
                    Ingresá tu PIN de portal para autorizar la recepción.
                </p>
            </div>

            <Button
                onClick={handleConfirm}
                disabled={loading || token.length < 4}
                size="lg"
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 gap-3 group transition-all"
            >
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        <PackageCheck className="h-6 w-6" />
                        Confirmar Recepción
                    </>
                )}
            </Button>
        </div>
    );
}
