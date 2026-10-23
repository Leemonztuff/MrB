import { BadgePercent, CreditCard, FileText, Tag } from "lucide-react";
import type { Promotion, SalesCondition } from "@/types";
import { formatCurrency } from "@/lib/formatters";

function formatPromotionRule(promotion: Promotion) {
  const rules = promotion.rules;

  switch (rules?.type) {
    case "buy_x_get_y_free":
      return `Llevando ${rules.buy ?? "X"} unidades, recibís ${rules.get ?? "Y"} de regalo.`;
    case "free_shipping":
      return `Envío gratis desde ${rules.min_units ?? "X"} unidades.`;
    case "min_amount_discount":
      return `${rules.percentage}% de descuento en compras desde ${formatCurrency(Number(rules.min_amount) || 0)}.`;
    default:
      return promotion.description;
  }
}

function formatSalesConditionRule(condition: SalesCondition) {
  const rules = condition.rules;

  switch (rules?.type) {
    case "net_days":
      return `Pago a ${rules.days ?? "N/D"} días.`;
    case "discount":
      return `${rules.percentage ?? "N/D"}% de descuento por pronto pago.`;
    case "installments":
      return `Financiación en ${rules.installments ?? "N/D"} cuotas.`;
    default:
      return condition.description;
  }
}

export function AgreementSummary({
  agreementName,
  priceListName,
  pricesIncludeVat,
  vatPercentage,
  promotions,
  salesConditions,
}: {
  agreementName: string;
  priceListName: string;
  pricesIncludeVat: boolean;
  vatPercentage: number;
  promotions: Promotion[];
  salesConditions: SalesCondition[];
}) {
  return (
    <section
      aria-labelledby="agreement-summary-title"
      className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="agreement-summary-title" className="text-sm font-bold">
          Tus condiciones comerciales
        </h3>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Convenio</dt>
          <dd className="font-semibold">{agreementName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lista de precios</dt>
          <dd className="font-semibold">{priceListName}</dd>
        </div>
        <div className="flex items-start gap-2 sm:col-span-2">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">IVA</dt>
            <dd>{pricesIncludeVat ? "Incluido en los precios" : `Se suma al total (${vatPercentage}%)`}</dd>
          </div>
        </div>
      </dl>

      {promotions.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold">
            <BadgePercent className="h-4 w-4 text-primary" aria-hidden="true" />
            Promociones del convenio
          </h4>
          <ul className="space-y-2 text-sm">
            {promotions.map((promotion) => {
              const rule = formatPromotionRule(promotion);
              return (
                <li key={promotion.id}>
                  <p className="font-medium">{promotion.name}</p>
                  {rule && <p className="text-xs text-muted-foreground">{rule}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {salesConditions.length > 0 && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold">
            <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
            Condiciones de venta
          </h4>
          <ul className="space-y-2 text-sm">
            {salesConditions.map((condition) => {
              const rule = formatSalesConditionRule(condition);
              return (
                <li key={condition.id}>
                  <p className="font-medium">{condition.name}</p>
                  {rule && <p className="text-xs text-muted-foreground">{rule}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
