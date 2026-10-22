export type CuratedOrderLineInput = {
  quantity: number;
  products: { id: string; name: string } | null;
};

export type CuratedOrderLine = {
  id: string;
  name: string;
  quantity: number;
};

export function aggregateOrderItems(items: CuratedOrderLineInput[]): CuratedOrderLine[] {
  const lines = new Map<string, CuratedOrderLine>();

  for (const item of items) {
    const name = item.products?.name || 'Producto sin nombre';
    const id = item.products?.id || name.toLocaleLowerCase();
    const line = lines.get(id) ?? { id, name, quantity: 0 };

    line.quantity += item.quantity;
    lines.set(id, line);
  }

  return [...lines.values()];
}
