export type OrderDispatchBlocker = 'whatsapp' | 'preparation' | 'label';

type OrderWorkflowTimestamps = {
    whatsapp_confirmed_at?: string | null;
    prepared_at?: string | null;
    printed_at?: string | null;
};

export function getOrderDispatchBlocker(order: OrderWorkflowTimestamps): OrderDispatchBlocker | null {
    if (!order.whatsapp_confirmed_at) return 'whatsapp';
    if (!order.prepared_at) return 'preparation';
    if (!order.printed_at) return 'label';
    return null;
}
