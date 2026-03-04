
'use client';

import { useState } from 'react';
import { Product, ActionResponse } from '@/types';
import { ProductStockStatus } from '@/domain/inventory/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MovementDialog } from './movement-dialog';
import { HistoryDialog } from './history-dialog';

interface InventoryTableProps {
    products: Product[];
    stockMap: Record<string, ProductStockStatus>;
}

export function InventoryTable({ products, stockMap }: InventoryTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por producto o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-11 bg-background/50 border-border/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {/* Stats Summary */}
                <Card className="glass border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Productos Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                    </CardContent>
                </Card>
                <Card className="glass border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-500 uppercase tracking-wider">Stock Bajo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {products.filter(p => (stockMap[p.id]?.availableStock ?? 0) < 10).length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="glass border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-500 uppercase tracking-wider">Reservados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {Object.values(stockMap).reduce((acc, s) => acc + s.reservedStock, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden glass">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[300px]">Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Stock Físico</TableHead>
                            <TableHead className="text-right">Reservas</TableHead>
                            <TableHead className="text-right">Disponible</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => {
                            const status = stockMap[product.id] || {
                                currentStock: 0,
                                reservedStock: 0,
                                availableStock: 0
                            };

                            const isLowStock = status.availableStock < 10;
                            const isOutStack = status.availableStock <= 0;

                            return (
                                <TableRow key={product.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{product.name}</span>
                                            {isOutStack ? (
                                                <span className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Sin Stock
                                                </span>
                                            ) : isLowStock && (
                                                <span className="text-[10px] text-amber-500 font-bold uppercase flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Stock Bajo
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-muted/50 text-[10px] uppercase font-bold tracking-wider">
                                            {product.category || 'Sin Cat.'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-mono text-base">{status.currentStock}</span>
                                    </TableCell>
                                    <TableCell className="text-right text-blue-500">
                                        <span className="font-mono">{status.reservedStock}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={cn(
                                            "font-mono text-lg font-bold",
                                            isOutStack ? "text-red-500" : isLowStock ? "text-amber-500" : "text-green-500"
                                        )}>
                                            {status.availableStock}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 text-foreground">
                                            <MovementDialog productId={product.id} productName={product.name} />
                                            <HistoryDialog productId={product.id} productName={product.name} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
