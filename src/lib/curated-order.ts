export type CuratedOrderLineInput = {
  quantity: number;
  is_bonus?: boolean;
  products: { id: string; name: string } | null;
};

export type CuratedOrderLine = {
  id: string;
  name: string;
  quantity: number;
  bonusQuantity: number;
};

export function aggregateOrderItems(items: CuratedOrderLineInput[]): CuratedOrderLine[] {
  const lines = new Map<string, CuratedOrderLine>();

  for (const item of items) {
    const name = item.products?.name || 'Producto sin nombre';
    const id = item.products?.id || name.toLocaleLowerCase();
    const line = lines.get(id) ?? { id, name, quantity: 0, bonusQuantity: 0 };

    line.quantity += item.quantity;
    if (item.is_bonus) line.bonusQuantity += item.quantity;
    lines.set(id, line);
  }

  return [...lines.values()];
}
