import { InventoryMovement, ProductStockStatus } from "./types";

/**
 * Pure function to calculate stock levels from a list of movements.
 * This follows the "stock as calculation" philosophy.
 */
export function calculateStockFromMovements(productId: string, movements: InventoryMovement[]): ProductStockStatus {
    const productMovements = movements.filter(m => m.product_id === productId);

    let currentBalance = 0;
    let reserved = 0;

    productMovements.forEach(m => {
        switch (m.type) {
            case 'in':
                currentBalance += m.quantity;
                break;
            case 'out':
                currentBalance -= m.quantity;
                break;
            case 'adjustment':
                // Adjustments in this system are deltas (e.g., +5 or -5)
                // If the user wants absolute adjustments, we'd need a different logic,
                // but delta-based adjustments are more auditable.
                currentBalance += m.quantity;
                break;
            case 'reserved':
                reserved += m.quantity;
                break;
        }
    });

    return {
        productId,
        currentStock: currentBalance,
        reservedStock: reserved,
        availableStock: currentBalance - reserved
    };
}

/**
 * Calculates stock for multiple products at once.
 */
export function calculateBulkStock(movements: InventoryMovement[]): Record<string, ProductStockStatus> {
    const stockMap: Record<string, ProductStockStatus> = {};

    movements.forEach(m => {
        if (!stockMap[m.product_id]) {
            stockMap[m.product_id] = {
                productId: m.product_id,
                currentStock: 0,
                reservedStock: 0,
                availableStock: 0
            };
        }

        const status = stockMap[m.product_id];

        switch (m.type) {
            case 'in':
                status.currentStock += m.quantity;
                break;
            case 'out':
                status.currentStock -= m.quantity;
                break;
            case 'adjustment':
                status.currentStock += m.quantity;
                break;
            case 'reserved':
                status.reservedStock += m.quantity;
                break;
        }

        status.availableStock = status.currentStock - status.reservedStock;
    });

    return stockMap;
}
