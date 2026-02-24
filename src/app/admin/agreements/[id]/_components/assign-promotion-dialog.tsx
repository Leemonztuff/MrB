"use client";

import {
  getUnassignedPromotions,
  assignMultiplePromotionsToAgreement,
} from "@/app/admin/actions/agreements.actions";
import type { Promotion } from "@/types";
import { promotionFormConfig } from "../../../promotions/_components/form-config";
import { AssignEntityDialog } from "./assign-entity-dialog";

const renderPromotion = (promo: Promotion) => (
  <div className="flex flex-col">
    <p>{promo.name}</p>
    <p className="text-sm font-normal text-muted-foreground">{promo.description}</p>
  </div>
);

export function AssignPromotionDialog({
  children,
  agreementId,
}: {
  children: React.ReactNode;
  agreementId: string;
}) {
  return (
    <AssignEntityDialog<Promotion>
      agreementId={agreementId}
      entityName="la Promoción"
      entityNamePlural="Promociones"
      getUnassignedEntitiesAction={getUnassignedPromotions}
      assignAction={assignMultiplePromotionsToAgreement}
      assignPayloadKey="promotion_ids"
      renderItem={renderPromotion}
      creationFormConfig={promotionFormConfig}
    >
      {children}
    </AssignEntityDialog>
  );
}
