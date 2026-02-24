
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getOrdersBatch } from "@/app/admin/actions/orders.actions";
import { Logo } from "@/app/logo";
import { Loader2 } from "lucide-react";

function LabelsPrintContent() {
    const searchParams = useSearchParams();
    const [labels, setLabels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
        const loadData = async () => {
            const dataParam = searchParams.get("data");
            if (!dataParam) return;

            try {
                const selections: { id: string; bundles: number }[] = JSON.parse(dataParam);
                const { data: orders, error } = await getOrdersBatch(selections.map(o => o.id));

                if (error || !orders) throw new Error("Error fetching orders");

                const allLabels: any[] = [];
                selections.forEach(sel => {
                    const order = orders.find(o => o.id === sel.id);
                    if (order) {
                        for (let i = 1; i <= sel.bundles; i++) {
                            allLabels.push({
                                ...order,
                                bundleIdx: i,
                                totalBundles: sel.bundles
                            });
                        }
                    }
                });
                setLabels(allLabels);
            } catch (err) {
                console.error("Print Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [searchParams]);

    useEffect(() => {
        if (!loading && labels.length > 0) {
            // Un pequeño delay para que las imágenes (QR) carguen antes de imprimir
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, labels]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-3 font-medium">Generando rótulos...</p>
            </div>
        );
    }

    return (
        <div className="print-container">
            <style jsx global>{`
                @media screen {
                    body { background: #f0f0f0; padding: 20px; }
                    .print-container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white; margin: 0; padding: 0; }
                    .print-container { box-shadow: none; width: 100%; }
                    .no-print { display: none !important; }
                }
                .label-page {
                    width: 210mm;
                    height: 297mm;
                    padding: 10mm;
                    box-sizing: border-box;
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                }
                .label-row {
                    height: 33.33%;
                    width: 100%;
                    border-bottom: 2px dashed #ccc;
                    display: flex;
                    padding: 15px;
                    box-sizing: border-box;
                }
                .label-row:last-child { border-bottom: none; }
                .label-left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
                .label-right { width: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px solid #eee; }
                .label-title { font-size: 32px; font-weight: 900; margin-bottom: 10px; color: black; letter-spacing: -1px; }
                .label-client { font-size: 22px; font-weight: 700; margin-bottom: 5px; color: black; }
                .label-address { font-size: 16px; color: #444; margin-bottom: 15px; }
                .label-meta { font-size: 11px; color: #888; text-transform: uppercase; font-weight: bold; }
                .qr-img { width: 120px; height: 120px; margin-bottom: 5px; }
                .qr-text { font-size: 9px; font-weight: bold; color: #666; margin-bottom: 10px; }
                .bundle-badge { background: black; color: #E6D5A7; padding: 6px 15px; font-size: 16px; font-weight: 900; width: 100%; text-align: center; }
            `}</style>

            {Array.from({ length: Math.ceil(labels.length / 3) }).map((_, pageIdx) => (
                <div key={pageIdx} className="label-page">
                    {labels.slice(pageIdx * 3, pageIdx * 3 + 3).map((label, idx) => (
                        <div key={`${label.id}-${idx}`} className="label-row">
                            <div className="label-left">
                                <h1 className="label-title">MR. BLONDE</h1>
                                <p className="label-client">{label.client_name_cache || "Cliente"}</p>
                                <p className="label-address">{label.clients?.address || "Dirección no registrada"}</p>
                                <div className="label-meta">
                                    Pedido #{label.id?.slice(-6).toUpperCase()} | {new Date().toLocaleDateString("es-AR")}
                                </div>
                            </div>
                            <div className="label-right">
                                <img
                                    className="qr-img"
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${origin}/api/pedido/confirmar/${label.id}`)}`}
                                    alt="QR"
                                />
                                <span className="qr-text">SCAN PARA CONFORMAR</span>
                                <div className="bundle-badge">
                                    BULTO {label.bundleIdx} DE {label.totalBundles}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function LabelsPrintPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LabelsPrintContent />
        </Suspense>
    );
}
