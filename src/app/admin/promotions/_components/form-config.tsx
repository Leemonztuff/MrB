
"use client";

import { z } from "zod";
import { upsertPromotion } from "@/app/admin/actions/promotions.actions";
import type { FormConfig } from "../../_components/entity-dialog";
import { PromotionFormFields } from "./promotion-form-fields";

// --- Zod Schemas for Rules ---
const buyXgetYFreeSchema = z.object({
  buy: z.coerce.number().min(1, "Debe ser al menos 1"),
  get: z.coerce.number().min(1, "Debe ser al menos 1"),
});

const freeShippingSchema = z.object({
  min_units: z.coerce.number().min(1, "Debe ser al menos 1"),
  locations: z.string().min(1, "Debe haber al menos una ciudad"),
});

const minAmountDiscountSchema = z.object({
  min_amount: z.coerce.number().min(1, "El monto mínimo debe ser mayor a 0."),
  percentage: z.coerce.number().min(1, "El porcentaje debe ser entre 1 y 100.").max(100, "El porcentaje no puede ser mayor a 100."),
});


// --- Main Form Schema with Refined Validation ---
const promotionSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  type: z.enum(["buy_x_get_y_free", "free_shipping", "min_amount_discount"]),
  rules: z.object({
    buy_x_get_y_free: buyXgetYFreeSchema.optional(),
    free_shipping: freeShippingSchema.optional(),
    min_amount_discount: minAmountDiscountSchema.optional(),
  })
}).superRefine((data, ctx) => {
    if (data.type === 'buy_x_get_y_free') {
        const result = buyXgetYFreeSchema.safeParse(data.rules.buy_x_get_y_free);
        if (!result.success) {
            result.error.errors.forEach(err => {
                ctx.addIssue({
                    ...err,
                    path: ["rules", "buy_x_get_y_free", ...err.path],
                });
            });
        }
    }
    if (data.type === 'free_shipping') {
        const result = freeShippingSchema.safeParse(data.rules.free_shipping);
        if (!result.success) {
            result.error.errors.forEach(err => {
                ctx.addIssue({
                    ...err,
                    path: ["rules", "free_shipping", ...err.path],
                });
            });
        }
    }
    if (data.type === 'min_amount_discount') {
        const result = minAmountDiscountSchema.safeParse(data.rules.min_amount_discount);
        if (!result.success) {
            result.error.errors.forEach(err => {
                ctx.addIssue({
                    ...err,
                    path: ["rules", "min_amount_discount", ...err.path],
                });
            });
        }
    }
});


// --- Default Values and Payload Processing ---
const getPromotionDefaultValues = (promotion?: any) => {
  if (!promotion) {
    return {
      name: "",
      description: "",
      type: "buy_x_get_y_free" as const,
      rules: {
        buy_x_get_y_free: { buy: 8, get: 2 },
        free_shipping: { min_units: 12, locations: "" },
        min_amount_discount: { min_amount: 100000, percentage: 10 },
      }
    };
  }

  const rules = promotion.rules || {};
  return {
    name: promotion.name,
    description: promotion.description ?? "",
    type: rules.type || "buy_x_get_y_free",
    rules: {
      buy_x_get_y_free: {
        buy: rules.buy || 8,
        get: rules.get || 2,
      },
      free_shipping: {
        min_units: rules.min_units || 12,
        locations: (rules.locations || []).join(", "),
      },
       min_amount_discount: {
        min_amount: rules.min_amount || 100000,
        percentage: rules.percentage || 10,
      },
    }
  };
};

const processPromotionPayload = (values: z.infer<typeof promotionSchema>) => {
  let ruleDetails: any = {};
  if (values.type === "buy_x_get_y_free" && values.rules.buy_x_get_y_free) {
    ruleDetails = values.rules.buy_x_get_y_free;
  } else if (values.type === "free_shipping" && values.rules.free_shipping) {
    ruleDetails = {
      ...values.rules.free_shipping,
      locations: values.rules.free_shipping.locations.split(',').map(s => s.trim()).filter(Boolean),
    };
  } else if (values.type === "min_amount_discount" && values.rules.min_amount_discount) {
    ruleDetails = values.rules.min_amount_discount;
  }

  return {
    name: values.name,
    description: values.description,
    rules: {
        type: values.type,
        ...ruleDetails
    },
  };
};


// --- Form Configuration ---
export const promotionFormConfig: FormConfig<typeof promotionSchema> = {
  entityName: "Promoción",
  schema: promotionSchema,
  upsertAction: (values) => upsertPromotion(processPromotionPayload(values)),
  getDefaultValues: getPromotionDefaultValues,
  renderFields: (form: any) => <PromotionFormFields form={form} />,
};
