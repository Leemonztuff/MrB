
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

function LabelCard({ label, logoUrl, origin }: { label: OrderData; logoUrl: string | null; origin: string }) {
    const shortId = label.id?.slice(-6).toUpperCase() || "N/A";
    const date = new Date(label.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    
    return (
        <div className="label-card">
            <div className="label-header">
                <div className="label-logo">
                    {logoUrl ? (
                        <Image 
                            src={logoUrl} 
                            alt="Logo" 
                            width={80} 
                            height={24}
                            style={{ height: '24px', width: 'auto' }}
                            unoptimized
                        />
                    ) : (
                        <span className="logo-text">MR. BLONDE</span>
                    )}
                </div>
                <div className="label-order-id">
                    #{shortId}
                </div>
            </div>
            
            <div className="label-content">
                <div className="label-main">
                    <div className="client-name">
                        {label.client_name_cache || "Cliente"}
                    </div>
                    
                    <div className="address-row">
                        <span className="address-icon">📍</span>
                        <span className="address-text">
                            {label.clients?.address || "Sin dirección"}
                        </span>
                    </div>
                    
                    {label.clients?.delivery_window && (
                        <div className="delivery-row">
                            <span className="delivery-icon">📅</span>
                            <span className="delivery-text">{label.clients.delivery_window}</span>
                        </div>
                    )}
                    
                    {label.notes && (
                        <div className="notes-row">
                            <span className="notes-text">📝 {label.notes}</span>
                        </div>
                    )}
                    
                    <div className="contact-row">
                        {label.clients?.phone || label.clients?.email || 'Sin contacto'}
                    </div>
                </div>
                
                <div className="label-qr">
                    <Image
                        className="qr-img"
                        width={70}
                        height={70}
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${origin}/api/pedido/confirmar/${label.id}`)}`}
                        alt="QR"
                        unoptimized
                    />
                    <div className="bundle-badge">
                        {label.bundleIdx}/{label.totalBundles}
                    </div>
                </div>
            </div>
            
            <div className="label-footer">
                <span className="date">{date}</span>
            </div>
        </div>
    );
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

    const labelsPerPage = 4;
    const pages: OrderData[][] = [];
    for (let i = 0; i < labels.length; i += labelsPerPage) {
        pages.push(labels.slice(i, i + labelsPerPage));
    }

    return (
        <div className="Print-wrapper">
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
                    body { background: #f0f0f0; padding: 20px; }
                    .print-wrapper { max-width: 210mm; margin: 0 auto; }
                    .print-container { 
                        background: white; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
                    }
                }
                @media print {
                    @page { 
                        size: A4; 
                        margin: 5mm; 
                    }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-container { box-shadow: none !important; }
                    .no-print { display: none !important; }
                    .label-page { 
                        width: 100% !important; 
                        height: 282mm !important;
                        page-break-after: always;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        grid-template-rows: 1fr 1fr !important;
                        gap: 3mm !important;
                        padding: 3mm !important;
                    }
                    .label-page:last-child { page-break-after: auto; }
                    .label-card { 
                        break-inside: avoid; 
                        border: 1px solid #000 !important;
                    }
                }
                
                .label-page {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 1fr 1fr;
                    gap: 3mm;
                    padding: 3mm;
                    background: white;
                }
                
                .label-card {
                    border: 1px solid #000;
                    border-radius: 4px;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    min-height: 0;
                    overflow: hidden;
                }
                
                .label-header {
                    background: #1a1a1a;
                    color: #E6D5A7;
                    padding: 6px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .label-logo {
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                }
                
                .logo-text {
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }
                
                .label-order-id {
                    font-size: 10px;
                    font-weight: 700;
                }
                
                .label-content {
                    display: flex;
                    flex: 1;
                    min-height: 0;
                    gap: 4px;
                    padding: 6px;
                }
                
                .label-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                }
                
                .client-name {
                    font-size: 11px;
                    font-weight: 800;
                    color: #000;
                    text-transform: uppercase;
                    line-height: 1.2;
                    word-break: break-word;
                }
                
                .address-row, .delivery-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 3px;
                    font-size: 8px;
                }
                
                .address-icon, .delivery-icon {
                    font-size: 8px;
                    flex-shrink: 0;
                }
                
                .address-text {
                    font-size: 9px;
                    font-weight: 600;
                    color: #000;
                    line-height: 1.3;
                    word-break: break-word;
                }
                
                .delivery-text {
                    font-size: 8px;
                    font-weight: 600;
                    color: #000;
                }
                
                .notes-row {
                    background: #fffbeb;
                    padding: 3px 5px;
                    border-radius: 2px;
                    border-left: 2px solid #f59e0b;
                    margin-top: auto;
                }
                
                .notes-text {
                    font-size: 7px;
                    color: #000;
                    font-style: italic;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .contact-row {
                    font-size: 7px;
                    color: #666;
                    margin-top: auto;
                    padding-top: 3px;
                    border-top: 1px dashed #ddd;
                }
                
                .label-qr {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    flex-shrink: 0;
                }
                
                .qr-img {
                    width: 55px;
                    height: 55px;
                    border: 1px solid #000;
                    border-radius: 2px;
                }
                
                .bundle-badge {
                    background: #000;
                    color: #E6D5A7;
                    padding: 2px 8px;
                    font-size: 10px;
                    font-weight: 900;
                    border-radius: 2px;
                    text-transform: uppercase;
                }
                
                .label-footer {
                    background: #f5f5f5;
                    padding: 2px 8px;
                    display: flex;
                    justify-content: flex-end;
                    flex-shrink: 0;
                }
                
                .date {
                    font-size: 7px;
                    color: #666;
                }
            `}</style>

            <div className="print-container">
                {pages.map((pageLabels, pageIdx) => (
                    <div key={pageIdx} className="label-page">
                        {pageLabels.map((label, labelIdx) => (
                            <LabelCard 
                                key={`${label.id}-${labelIdx}`} 
                                label={label} 
                                logoUrl={logoUrl} 
                                origin={origin} 
                            />
                        ))}
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
