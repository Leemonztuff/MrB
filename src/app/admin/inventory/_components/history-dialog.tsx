
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { History, TrendingUp, TrendingDown, RefreshCcw, Lock } from 'lucide-react';
import { getProductMovements } from '@/app/admin/actions/inventory.actions';
import { InventoryMovement } from '@/domain/inventory/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HistoryDialogProps {
    productId: string;
    productName: string;
}

export function HistoryDialog({ productId, productName }: HistoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [movements, setMovements] = useState<InventoryMovement[]>([]);

    async function handleOpen() {
        setOpen(true);
        setLoading(true);
        try {
            const result = await getProductMovements(productId);
            if (result.success) {
                setMovements(result.data || []);
            }
        } finally {
            setLoading(false);
        }
    }

    const typeConfig = {
        in: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Entrada' },
        out: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Salida' },
        adjustment: { icon: RefreshCcw, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Ajuste' },
        reserved: { icon: Lock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Reserva' },
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={handleOpen}>
                    <History className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass border-border/50">
                <DialogHeader>
                    <DialogTitle className="flex flex-col gap-1">
                        <span>Historial de Movimientos</span>
                        <span className="text-sm font-normal text-muted-foreground">{productName}</span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            Cargando historial...
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground italic">
                            No hay movimientos registrados.
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {movements.map((m) => {
                                const config = typeConfig[m.type];
                                const Icon = config.icon;

                                return (
                                    <div key={m.id} className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors">
                                        <div className={cn("p-2 rounded-full", config.bg)}>
                                            <Icon className={cn("h-4 w-4", config.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight", config.color, config.bg, "border-none")}>
                                                    {config.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(m.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{m.reason}</p>
                                            {m.reference_id && (
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Ref: {m.reference_id}</p>
                                            )}
                                        </div>
                                        <div className={cn("text-lg font-mono font-bold", config.color)}>
                                            {m.type === 'out' || m.type === 'reserved' ? `-${m.quantity}` : `+${m.quantity}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
