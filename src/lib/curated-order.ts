export type CuratedOrderProductInput = {
  id?: string;
  name?: string | null;
};

export type CuratedOrderLineInput = {
  quantity: number;
  products?: CuratedOrderProductInput | CuratedOrderProductInput[] | null;
};

export type CuratedOrderLine = {
  id: string;
  name: string;
  quantity: number;
};

export function aggregateOrderItems(items: CuratedOrderLineInput[]): CuratedOrderLine[] {
  const lines = new Map<string, CuratedOrderLine>();

  for (const item of items) {
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const name = product?.name?.trim() || 'Producto sin nombre';
    const id = product?.id || name.toLocaleLowerCase();
    const line = lines.get(id) ?? { id, name, quantity: 0 };

    line.quantity += item.quantity;
    lines.set(id, line);
  }

  return [...lines.values()];
}
