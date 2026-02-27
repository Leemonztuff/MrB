
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getOrdersBatch } from "@/app/admin/actions/orders.actions";
import { getSettings } from "@/app/admin/actions/settings.actions";
import { Loader2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderData {
    id: string;
    client_id: string | null;
    agreement_id: string | null;
    created_at: string;
    total_amount: number;
    status: string;
    client_name_cache: string;
    notes: string | null;
    order_items: any[];
    bundleIdx?: number;
    totalBundles?: number;
    clients: {
        contact_name: string | null;
        address: string | null;
        delivery_window: string | null;
        phone: string | null;
        email: string | null;
    } | null;
}

function LabelsPrintContent() {
    const searchParams = useSearchParams();
    const [labels, setLabels] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [origin, setOrigin] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        setOrigin(window.location.origin);
        const loadData = async () => {
            const dataParam = searchParams.get("data");
            if (!dataParam) return;

            try {
                const selections: { id: string; bundles: number }[] = JSON.parse(dataParam);
                const { data: orders, error } = await getOrdersBatch(selections.map(o => o.id));
                
                const settings = await getSettings();
                if (settings.logo_url) {
                    setLogoUrl(settings.logo_url);
                }

                if (error || !orders) throw new Error("Error fetching orders");

                const allLabels: OrderData[] = [];
                selections.forEach(sel => {
                    const order = orders.find(o => o.id === sel.id);
                    if (order) {
                        for (let i = 1; i <= sel.bundles; i++) {
                            allLabels.push({
                                ...order,
                                bundleIdx: i,
                                totalBundles: sel.bundles
                            } as OrderData);
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

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const printContent = document.querySelector('.print-container');
        if (!printContent) return;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        printWindow.document.write('<html><head><title>Rótulos de Entrega</title>');
        printWindow.document.write(document.querySelector('style')?.outerHTML || '');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-3 font-medium">Generando rótulos...</p>
            </div>
        );
    }

    return (
        <div className="print-wrapper">
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
                <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                </Button>
            </div>

            <style jsx global>{`
                @media screen {
                    body { background: #e5e5e5; padding: 20px; }
                    .print-wrapper { max-width: 1000px; margin: 0 auto; }
                    .print-container { 
                        background: white; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .print-wrapper { position: relative; }
                }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .print-container { 
                        box-shadow: none !important; 
                        width: 100% !important; 
                        max-width: none !important;
                        border-radius: 0 !important;
                    }
                    .no-print { display: none !important; }
                    .label-page { 
                        width: 100% !important; 
                        height: auto !important;
                        min-height: 297mm;
                        padding: 15mm !important;
                        page-break-after: always;
                    }
                    .label-card {
                        break-inside: avoid;
                        border: 2px solid #000 !important;
                        margin-bottom: 10mm !important;
                        border-radius: 0 !important;
                    }
                }
                .label-page {
                    padding: 15mm;
                    background: white;
                }
                .label-card {
                    border: 2px solid #000;
                    border-radius: 8px;
                    padding: 0;
                    margin-bottom: 15px;
                    display: flex;
                    background: white;
                }
                .label-header {
                    background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
                    color: #E6D5A7;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .label-logo {
                    font-size: 28px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .label-order-info {
                    text-align: right;
                    font-size: 12px;
                    opacity: 0.9;
                }
                .label-body {
                    display: flex;
                    padding: 0;
                }
                .label-main {
                    flex: 1;
                    padding: 20px;
                    border-right: 2px dashed #ccc;
                }
                .label-sidebar {
                    width: 200px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #f9f9f9;
                }
                .client-name {
                    font-size: 24px;
                    font-weight: 800;
                    color: #000;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }
                .address-section {
                    margin-bottom: 15px;
                }
                .address-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 4px;
                }
                .address-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #000;
                }
                .delivery-info {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #fffbeb;
                    border-radius: 6px;
                    border-left: 4px solid #f59e0b;
                }
                .delivery-item {
                    flex: 1;
                }
                .delivery-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #92400e;
                    text-transform: uppercase;
                }
                .delivery-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #000;
                }
                .notes-section {
                    padding: 10px;
                    background: #fef3c7;
                    border-radius: 6px;
                    border-left: 4px solid #f59e0b;
                }
                .notes-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #92400e;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .notes-value {
                    font-size: 14px;
                    color: #000;
                    font-style: italic;
                }
                .qr-section {
                    text-align: center;
                    margin-bottom: 15px;
                }
                .qr-img {
                    width: 140px;
                    height: 140px;
                    border: 3px solid #000;
                    border-radius: 8px;
                }
                .qr-text {
                    font-size: 10px;
                    font-weight: 800;
                    color: #000;
                    text-transform: uppercase;
                    margin-top: 8px;
                    letter-spacing: 1px;
                }
                .bundle-badge {
                    background: #000;
                    color: #E6D5A7;
                    padding: 12px 20px;
                    font-size: 18px;
                    font-weight: 900;
                    width: 100%;
                    text-align: center;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .contact-info {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                }
                .page-break { page-break-after: always; }
                @media print {
                    .page-break { page-break-after: always; }
                }
            `}</style>

            <div className="print-container">
                {labels.map((label, idx) => (
                    <div key={`${label.id}-${idx}`} className={`label-card ${(idx + 1) % 3 === 0 ? 'page-break' : ''}`}>
                        <div className="label-header">
                            <div className="label-logo">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" style={{ height: '40px' }} />
                                ) : (
                                    'MR. BLONDE'
                                )}
                            </div>
                            <div className="label-order-info">
                                <div>PEDIDO #{label.id?.slice(-8).toUpperCase()}</div>
                                <div>{new Date(label.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            </div>
                        </div>
                        
                        <div className="label-body">
                            <div className="label-main">
                                <div className="client-name">
                                    {label.client_name_cache || "Cliente"}
                                </div>
                                
                                <div className="address-section">
                                    <div className="address-label">Dirección de Entrega</div>
                                    <div className="address-value">
                                        {label.clients?.address || "Dirección no registrada"}
                                    </div>
                                </div>
                                
                                {label.clients?.delivery_window && (
                                    <div className="delivery-info">
                                        <div className="delivery-item">
                                            <div className="delivery-label">Día de Entrega</div>
                                            <div className="delivery-value">{label.clients.delivery_window}</div>
                                        </div>
                                    </div>
                                )}
                                
                                {label.notes && (
                                    <div className="notes-section">
                                        <div className="notes-label">Notas del Pedido</div>
                                        <div className="notes-value">{label.notes}</div>
                                    </div>
                                )}
                                
                                <div className="contact-info">
                                    <strong>Contacto:</strong> {label.clients?.phone || label.clients?.email || 'No disponible'}
                                </div>
                            </div>
                            
                            <div className="label-sidebar">
                                <div className="qr-section">
                                        <img
                                            className="qr-img"
                                            width={140}
                                            height={140}
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${origin}/api/pedido/confirmar/${label.id}`)}`}
                                            alt="QR de Conformidad"
                                        />
                                    <div className="qr-text">ESCANEAR PARA CONFORMAR</div>
                                </div>
                                
                                <div className="bundle-badge">
                                    BULTO {label.bundleIdx} DE {label.totalBundles}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LabelsPrintPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <LabelsPrintContent />
        </Suspense>
    );
}
