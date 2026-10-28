export type WizardStepId =
  | "products"
  | "price-list"
  | "agreement"
  | "client"
  | "order";

export type WizardStep = {
  id: WizardStepId;
  title: string;
  description: string;
  href: string;
  completed: boolean;
};

export type WizardCounts = {
  products: number;
  priceLists: number;
  agreements: number;
  clients: number;
  orders: number;
};

export function buildWizardSteps(counts: WizardCounts): WizardStep[] {
  return [
    {
      id: "products",
      title: "Cargá tus primeros productos",
      description:
        "Entrá a Productos y agregá al menos uno con nombre, categoría e imagen. Son la base de todo el catálogo.",
      href: "/admin/products",
      completed: counts.products > 0,
    },
    {
      id: "price-list",
      title: "Creá una lista de precios",
      description:
        "En Comercial → Listas de Precios, creá una lista y asignale productos con su precio de venta y precio por volumen.",
      href: "/admin/commercial-settings?tab=pricelists",
      completed: counts.priceLists > 0,
    },
    {
      id: "agreement",
      title: "Armá un convenio",
      description:
        "Un convenio reúne la lista de precios, promociones y condiciones de venta. Creá uno desde Convenios y elegí su lista.",
      href: "/admin/agreements",
      completed: counts.agreements > 0,
    },
    {
      id: "client",
      title: "Creá tu primer cliente",
      description:
        "Desde Clientes podés cargarlo manualmente o generar un enlace para que complete sus datos. Asignale un convenio para que pueda pedir.",
      href: "/admin/clients",
      completed: counts.clients > 0,
    },
    {
      id: "order",
      title: "Recibí y gestioná el primer pedido",
      description:
        "Cuando el cliente envíe su pedido, aparecerá en Pedidos. Seguí el tablero para confirmarlo, prepararlo, imprimir el rótulo y despacharlo.",
      href: "/admin/orders",
      completed: counts.orders > 0,
    },
  ];
}

export function getWizardProgress(steps: WizardStep[]) {
  const completed = steps.filter(step => step.completed).length;
  const next = steps.find(step => !step.completed) ?? null;

  return {
    completed,
    total: steps.length,
    next,
    isComplete: completed === steps.length,
  };
}
