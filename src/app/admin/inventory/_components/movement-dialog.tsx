
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createMovement } from '@/app/admin/actions/inventory.actions';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface MovementDialogProps {
    productId: string;
    productName: string;
}

export function MovementDialog({ productId, productName }: MovementDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'in' | 'adjustment'>('in');
    const [quantity, setQuantity] = useState('0');
    const [reason, setReason] = useState('');

    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit() {
        if (!quantity || parseInt(quantity) <= 0) {
            toast({ title: "Error", description: "La cantidad debe ser mayor a 0.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const result = await createMovement({
                productId,
                type,
                quantity: parseInt(quantity),
                reason: reason || (type === 'in' ? 'Entrada manual' : 'Ajuste manual')
            });

            if (result.success) {
                toast({ title: "Éxito", description: "Movimiento registrado correctamente." });
                setOpen(false);
                router.refresh();
            } else {
                throw new Error(result.error?.message);
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-border/50">
                <DialogHeader>
                    <DialogTitle>Registrar Movimiento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Producto</Label>
                        <div className="p-2 bg-muted/50 rounded-md font-medium">{productName}</div>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Movimiento</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="bg-background/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in">Entrada física (Compra/Devolución)</SelectItem>
                                <SelectItem value="adjustment">Ajuste (Corrección +/-)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="bg-background/50"
                        />
                        {type === 'adjustment' && (
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                Usa valores negativos para restar stock en ajustes.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Motivo / Referencia</Label>
                        <Input
                            id="reason"
                            placeholder="Ej: Compra a proveedor #123"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Registrando..." : "Guardar Movimiento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
