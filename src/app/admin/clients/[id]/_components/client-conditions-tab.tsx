
"use client";

import { useState, useEffect } from "react";
import { Info, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client, AgreementSalesCondition } from "@/types";
import { getAgreementSalesConditions } from "@/app/admin/actions/agreements.actions";

interface ClientConditionsTabProps {
  client: Client;
}

const formatRule = (rules: any): string => {
  if (!rules || typeof rules !== 'object') return 'Regla no definida';
  const { type, days, percentage, installments, initial_percentage, remaining_days } = rules;
  switch (type) {
    case 'net_days': return `Plazo: ${days || 'N/D'} días netos.`;
    case 'discount': return `Descuento pronto pago: ${percentage || 'N/D'}%.`;
    case 'installments': return `Financiación: ${installments || 'N/D'} cuotas.`;
    case 'split_payment': return `${initial_percentage || 'N/D'}% adelanto, resto ${remaining_days || 'N/D'} días.`;
    case 'cash_on_delivery': return `Pago al momento de la entrega.`;
    default: return 'Regla personalizada.';
  }
};

export function ClientConditionsTab({ client }: ClientConditionsTabProps) {
  const [salesConditions, setSalesConditions] = useState<AgreementSalesCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (client.agreement_id) {
      setIsLoading(true);
      getAgreementSalesConditions(client.agreement_id)
        .then(({ data }) => setSalesConditions(data || []))
        .finally(() => setIsLoading(false));
    } else {
      setSalesConditions([]);
      setIsLoading(false);
    }
  }, [client.agreement_id]);

  return (
    <div className="space-y-6">
      <Card className="glass border-white/5 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Situación Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-headline">
            {client.fiscal_status || "No especificada"}
          </p>
        </CardContent>
      </Card>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Acuerdos del Convenio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : salesConditions.length > 0 ? (
            <div className="space-y-4">
              {salesConditions.map((sc) => (
                <div 
                  key={sc.sales_conditions.id} 
                  className="p-4 rounded-lg bg-white/5 border border-white/5"
                >
                  <p className="font-bold text-sm mb-1">{sc.sales_conditions.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRule(sc.sales_conditions.rules)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No hay condiciones especiales asignadas a este cliente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
