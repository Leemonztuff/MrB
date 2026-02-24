
"use client";

import {
  getUnassignedSalesConditions,
  assignMultipleSalesConditionsToAgreement,
} from "@/app/admin/actions/agreements.actions";
import type { SalesCondition } from "@/types";
import { salesConditionFormConfig } from "../../../sales-conditions/_components/form-config";
import { AssignEntityDialog } from "./assign-entity-dialog";

const renderSalesCondition = (condition: SalesCondition) => (
  <div className="flex flex-col">
    <p>{condition.name}</p>
    <p className="text-sm font-normal text-muted-foreground">{condition.description}</p>
  </div>
);

export function AssignSalesConditionDialog({
  children,
  agreementId,
}: {
  children: React.ReactNode;
  agreementId: string;
}) {
  return (
    <AssignEntityDialog<SalesCondition>
      agreementId={agreementId}
      entityName="la Condición"
      entityNamePlural="Condiciones"
      getUnassignedEntitiesAction={getUnassignedSalesConditions}
      assignAction={assignMultipleSalesConditionsToAgreement}
      assignPayloadKey="sales_condition_ids"
      renderItem={renderSalesCondition}
      creationFormConfig={salesConditionFormConfig}
    >
      {children}
    </AssignEntityDialog>
  );
}
