export type MovementType = 'in' | 'out' | 'adjustment' | 'reserved';

export interface InventoryMovement {
    id: string;
    product_id: string;
    type: MovementType;
    quantity: number;
    reason: string | null;
    reference_id: string | null;
    created_at: string;
    created_by: string | null;
}

export interface ProductStockStatus {
    productId: string;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
}
