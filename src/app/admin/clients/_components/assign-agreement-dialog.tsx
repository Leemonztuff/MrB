"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { assignAgreementToClient } from "@/app/admin/actions/clients.actions";
import {
  assignMultiplePromotionsToAgreement,
  assignMultipleSalesConditionsToAgreement,
  deleteAgreement,
  getAgreements,
  upsertAgreement,
} from "@/app/admin/actions/agreements.actions";
import {
  assignProductsToPriceList,
  deletePriceList,
  getPriceListById,
  getPriceLists,
  upsertPriceList,
} from "@/app/admin/actions/pricelists.actions";
import { deletePromotion, getPromotions, upsertPromotion } from "@/app/admin/actions/promotions.actions";
import { deleteSalesCondition, getSalesConditions, upsertSalesCondition } from "@/app/admin/actions/sales-conditions.actions";
import type { AgreementWithCount, Client, PriceList, Promotion, SalesCondition } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AgreementMode = "existing" | "custom";
type ClientType = "barberia" | "distribuidor" | "especial";
type WizardStep = 0 | 1 | 2 | 3 | 4;
type PromotionDraftType = "buy_x_get_y_free" | "free_shipping" | "min_amount_discount";
type SalesConditionDraftType = "net_days" | "discount" | "installments" | "split_payment" | "cash_on_delivery";

type PromotionDraft = {
  name: string;
  description: string;
  type: PromotionDraftType;
  buy: string;
  get: string;
  minUnits: string;
  locations: string;
  minAmount: string;
  percentage: string;
};

type SalesConditionDraft = {
  name: string;
  description: string;
  type: SalesConditionDraftType;
  days: string;
  discountPercentage: string;
  installments: string;
  initialPercentage: string;
  remainingDays: string;
};

const wizardSteps = [
  { id: 0, title: "Camino", description: "Asignar uno existente o crear uno nuevo." },
  { id: 1, title: "Base", description: "Nombre, tipo y lista de precios." },
  { id: 2, title: "Promociones", description: "Selecciona o crea promociones para este cliente." },
  { id: 3, title: "Condiciones", description: "Define las reglas de cobro y financiacion." },
  { id: 4, title: "Revision", description: "Confirma el convenio y asignalo al cliente." },
] as const;

const emptyPromotionDraft = (): PromotionDraft => ({
  name: "",
  description: "",
  type: "buy_x_get_y_free",
  buy: "8",
  get: "2",
  minUnits: "12",
  locations: "",
  minAmount: "100000",
  percentage: "10",
});

const emptySalesConditionDraft = (): SalesConditionDraft => ({
  name: "",
  description: "",
  type: "net_days",
  days: "30",
  discountPercentage: "5",
  installments: "3",
  initialPercentage: "50",
  remainingDays: "30",
});

const isValidPromotionDraft = (draft: PromotionDraft) => {
  if (draft.name.trim().length < 3) return false;
  if (draft.type === "buy_x_get_y_free") return Number(draft.buy) > 0 && Number(draft.get) > 0;
  if (draft.type === "free_shipping") return Number(draft.minUnits) > 0 && draft.locations.trim().length > 0;
  return Number(draft.minAmount) > 0 && Number(draft.percentage) > 0;
};

const isValidSalesConditionDraft = (draft: SalesConditionDraft) => {
  if (draft.name.trim().length < 3) return false;
  if (draft.type === "net_days") return Number(draft.days) > 0;
  if (draft.type === "discount") return Number(draft.discountPercentage) > 0;
  if (draft.type === "installments") return Number(draft.installments) > 0;
  if (draft.type === "split_payment") {
    return Number(draft.initialPercentage) > 0 && Number(draft.initialPercentage) < 100 && Number(draft.remainingDays) > 0;
  }
  return true;
};

const buildPromotionPayload = (draft: PromotionDraft) => {
  if (draft.type === "buy_x_get_y_free") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: { type: draft.type, buy: Number(draft.buy), get: Number(draft.get) },
    };
  }

  if (draft.type === "free_shipping") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: {
        type: draft.type,
        min_units: Number(draft.minUnits),
        locations: draft.locations.split(",").map(item => item.trim()).filter(Boolean),
      },
    };
  }

  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    rules: { type: draft.type, min_amount: Number(draft.minAmount), percentage: Number(draft.percentage) },
  };
};

const buildSalesConditionPayload = (draft: SalesConditionDraft) => {
  if (draft.type === "net_days") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: { type: draft.type, days: Number(draft.days) },
    };
  }

  if (draft.type === "discount") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: { type: draft.type, percentage: Number(draft.discountPercentage) },
    };
  }

  if (draft.type === "installments") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: { type: draft.type, installments: Number(draft.installments) },
    };
  }

  if (draft.type === "split_payment") {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      rules: {
        type: draft.type,
        initial_percentage: Number(draft.initialPercentage),
        remaining_days: Number(draft.remainingDays),
      },
    };
  }

  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    rules: { type: draft.type },
  };
};

const ResourceChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition",
      selected ? "border-primary bg-primary/10 text-foreground" : "border-border/60 bg-card hover:border-primary/30"
    )}
  >
    <span className="text-sm font-medium">{label}</span>
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full border",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border/60"
      )}
    >
      {selected ? <Check className="h-3 w-3" /> : null}
    </span>
  </button>
);

export function AssignAgreementDialog({
  children,
  client,
}: {
  children: React.ReactNode;
  client: Client;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [mode, setMode] = useState<AgreementMode>("existing");
  const [step, setStep] = useState<WizardStep>(0);

  const [agreements, setAgreements] = useState<AgreementWithCount[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [salesConditions, setSalesConditions] = useState<SalesCondition[]>([]);

  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(client.agreement_id ?? null);
  const [agreementName, setAgreementName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("barberia");
  const [priceListMode, setPriceListMode] = useState<"existing" | "new" | "clone">("existing");
  const [selectedPriceListId, setSelectedPriceListId] = useState<string | null>(null);
  const [cloneBasePriceListId, setCloneBasePriceListId] = useState<string | null>(null);
  const [cloneDiscountPercentage, setCloneDiscountPercentage] = useState("0");
  const [newPriceListName, setNewPriceListName] = useState("");
  const [newPriceListIncludesVat, setNewPriceListIncludesVat] = useState(true);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState<string[]>([]);
  const [selectedSalesConditionIds, setSelectedSalesConditionIds] = useState<string[]>([]);
  const [promotionDrafts, setPromotionDrafts] = useState<PromotionDraft[]>([]);
  const [salesConditionDrafts, setSalesConditionDrafts] = useState<SalesConditionDraft[]>([]);
  const [promotionDraft, setPromotionDraft] = useState<PromotionDraft>(emptyPromotionDraft());
  const [salesConditionDraft, setSalesConditionDraft] = useState<SalesConditionDraft>(emptySalesConditionDraft());

  const { toast } = useToast();

  const resetState = () => {
    setMode("existing");
    setStep(0);
    setSelectedAgreementId(client.agreement_id ?? null);
    setAgreementName("");
    setClientType("barberia");
    setPriceListMode("existing");
    setSelectedPriceListId(null);
    setCloneBasePriceListId(null);
    setCloneDiscountPercentage("0");
    setNewPriceListName("");
    setNewPriceListIncludesVat(true);
    setSelectedPromotionIds([]);
    setSelectedSalesConditionIds([]);
    setPromotionDrafts([]);
    setSalesConditionDrafts([]);
    setPromotionDraft(emptyPromotionDraft());
    setSalesConditionDraft(emptySalesConditionDraft());
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    let mounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [agreementsResult, priceListsResult, promotionsResult, salesConditionsResult] = await Promise.all([
          getAgreements(),
          getPriceLists(),
          getPromotions(),
          getSalesConditions(),
        ]);

        if (!mounted) return;

        setAgreements(agreementsResult.data ?? []);
        setPriceLists(priceListsResult.data ?? []);
        setPromotions(promotionsResult.data ?? []);
        setSalesConditions(salesConditionsResult.data ?? []);
      } catch (error) {
        if (!mounted) return;
        toast({
          title: "No se pudo cargar el configurador",
          description: error instanceof Error ? error.message : "Reintenta en unos segundos.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [client.agreement_id, isOpen, toast]);

  const agreementSummary = useMemo(() => {
    const selectedAgreement = agreements.find(item => item.id === selectedAgreementId);
    const selectedPriceList = priceLists.find(item => item.id === selectedPriceListId);

    return {
      agreement: selectedAgreement?.agreement_name ?? (agreementName.trim() || "Sin definir"),
      priceList:
        priceListMode === "existing"
          ? selectedPriceList?.name || "Sin lista elegida"
          : newPriceListName.trim() || "Nueva lista sin nombre",
      promotions: selectedPromotionIds.length + promotionDrafts.length,
      salesConditions: selectedSalesConditionIds.length + salesConditionDrafts.length,
    };
  }, [
    agreementName,
    agreements,
    cloneBasePriceListId,
    cloneDiscountPercentage,
    newPriceListName,
    priceListMode,
    priceLists,
    promotionDrafts.length,
    salesConditionDrafts.length,
    selectedAgreementId,
    selectedPriceListId,
    selectedPromotionIds.length,
    selectedSalesConditionIds.length,
  ]);

  const toggleSelection = (value: string, current: string[], setter: (next: string[]) => void) => {
    setter(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };

  const validateCurrentStep = () => {
    if (mode === "existing") {
      if (!selectedAgreementId) {
        toast({
          title: "Falta elegir un convenio",
          description: "Selecciona uno existente o cambia al modo personalizado.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (agreementName.trim().length < 3) {
        toast({
          title: "Nombre incompleto",
          description: "El convenio necesita un nombre claro para poder guardarse.",
          variant: "destructive",
        });
        return false;
      }

      if (priceListMode === "existing" && !selectedPriceListId) {
        toast({
          title: "Falta la lista de precios",
          description: "Elige una lista existente o crea una nueva para este convenio.",
          variant: "destructive",
        });
        return false;
      }

      if (priceListMode === "new" && newPriceListName.trim().length < 3) {
        toast({
          title: "Falta nombrar la lista",
          description: "Ponle un nombre a la nueva lista de precios antes de seguir.",
          variant: "destructive",
        });
        return false;
      }

      if (priceListMode === "clone") {
        if (newPriceListName.trim().length < 3) {
          toast({
            title: "Falta nombrar la lista derivada",
            description: "Ponle un nombre a la nueva lista antes de clonar.",
            variant: "destructive",
          });
          return false;
        }

        if (!cloneBasePriceListId) {
          toast({
            title: "Falta la lista base",
            description: "Selecciona la lista que vas a usar como punto de partida.",
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    setStep(current => Math.min(current + 1, 4) as WizardStep);
  };

  const goBack = () => {
    if (mode === "custom" && step > 0) {
      setStep(current => Math.max(current - 1, 0) as WizardStep);
      return;
    }
    setIsOpen(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      let createdPriceListId: string | null = null;
      let createdAgreementId: string | null = null;
      const createdPromotionIds: string[] = [];
      const createdSalesConditionIds: string[] = [];

      try {
        if (mode === "existing") {
          if (!selectedAgreementId) throw new Error("Selecciona un convenio antes de guardar.");

          const result = await assignAgreementToClient({ clientId: client.id, agreementId: selectedAgreementId });
          if (result.error) throw new Error(result.error.message);

          toast({
            title: "Convenio asignado",
            description: "El cliente quedo vinculado al convenio seleccionado.",
          });
          setIsOpen(false);
          return;
        }

        let finalPriceListId = selectedPriceListId;

        if (priceListMode === "new") {
          const priceListResult = await upsertPriceList({
            name: newPriceListName.trim(),
            prices_include_vat: newPriceListIncludesVat,
          });

          if (priceListResult.error || !priceListResult.data) {
            throw new Error(priceListResult.error?.message || "No se pudo crear la lista de precios.");
          }

          const clonedPriceListId = priceListResult.data.id;
          createdPriceListId = clonedPriceListId;
          finalPriceListId = clonedPriceListId;
        }

        if (priceListMode === "clone") {
          if (!cloneBasePriceListId) {
            throw new Error("Falta seleccionar la lista base para clonar.");
          }

          const cloneDiscount = Number(cloneDiscountPercentage || "0");
          if (!Number.isFinite(cloneDiscount) || cloneDiscount < 0 || cloneDiscount > 100) {
            throw new Error("El ajuste porcentual debe ser un numero entre 0 y 100.");
          }

          const basePriceListResult = await getPriceListById(cloneBasePriceListId);
          if (basePriceListResult.error || !basePriceListResult.data) {
            throw new Error(basePriceListResult.error?.message || "No se pudo leer la lista base.");
          }

          const priceListResult = await upsertPriceList({
            name: newPriceListName.trim(),
            prices_include_vat: newPriceListIncludesVat,
          });

          if (priceListResult.error || !priceListResult.data) {
            throw new Error(priceListResult.error?.message || "No se pudo crear la lista derivada.");
          }

          const clonedPriceListId = priceListResult.data.id;
          createdPriceListId = clonedPriceListId;
          finalPriceListId = clonedPriceListId;

          const multiplier = 1 - cloneDiscount / 100;
          const products = basePriceListResult.data.price_list_items.map(item => ({
            product_id: item.product_id,
            price: Number((item.price * multiplier).toFixed(2)),
            volume_price: item.volume_price == null ? null : Number((item.volume_price * multiplier).toFixed(2)),
          }));

          if (products.length > 0) {
            const cloneResult = await assignProductsToPriceList({
              price_list_id: clonedPriceListId,
              products,
            });

            if (cloneResult.error) {
              throw new Error(cloneResult.error.message || "No se pudo copiar el contenido de la lista base.");
            }
          }
        }

        if (!finalPriceListId) throw new Error("El convenio necesita una lista de precios.");
        for (const draft of promotionDrafts) {
          const result = await upsertPromotion(buildPromotionPayload(draft));
          if (result.error || !result.data) throw new Error(result.error?.message || `No se pudo crear la promocion ${draft.name}.`);
          createdPromotionIds.push(result.data.id);
        }

        for (const draft of salesConditionDrafts) {
          const result = await upsertSalesCondition(buildSalesConditionPayload(draft));
          if (result.error || !result.data) throw new Error(result.error?.message || `No se pudo crear la condicion ${draft.name}.`);
          createdSalesConditionIds.push(result.data.id);
        }

        const agreementResult = await upsertAgreement({
          agreement_name: agreementName.trim(),
          client_type: clientType,
          price_list_id: finalPriceListId,
        });

        if (agreementResult.error || !agreementResult.data) {
          throw new Error(agreementResult.error?.message || "No se pudo crear el convenio.");
        }

        const agreementId = agreementResult.data.id;
        createdAgreementId = agreementId;
        const promotionIds = [...selectedPromotionIds, ...createdPromotionIds];
        const salesConditionIds = [...selectedSalesConditionIds, ...createdSalesConditionIds];

        if (promotionIds.length > 0) {
          const promotionsResult = await assignMultiplePromotionsToAgreement({
            agreement_id: agreementId,
            promotion_ids: promotionIds,
          });
          if (promotionsResult.error) throw new Error(promotionsResult.error.message || "No se pudieron vincular las promociones.");
        }

        if (salesConditionIds.length > 0) {
          const salesConditionsResult = await assignMultipleSalesConditionsToAgreement({
            agreement_id: agreementId,
            sales_condition_ids: salesConditionIds,
          });
          if (salesConditionsResult.error) throw new Error(salesConditionsResult.error.message || "No se pudieron vincular las condiciones.");
        }

        const assignResult = await assignAgreementToClient({ clientId: client.id, agreementId });
        if (assignResult.error) throw new Error(assignResult.error.message || "No se pudo asignar el convenio al cliente.");

        toast({
          title: "Convenio creado y asignado",
          description: "El cliente ya quedo configurado con su nuevo esquema comercial.",
        });
        setIsOpen(false);
      } catch (error) {
        if (createdAgreementId) {
          await deleteAgreement(createdAgreementId);
        }

        for (const promotionId of createdPromotionIds) {
          await deletePromotion(promotionId);
        }

        for (const salesConditionId of createdSalesConditionIds) {
          await deleteSalesCondition(salesConditionId);
        }

        if (createdPriceListId) {
          await deletePriceList(createdPriceListId);
        }

        toast({
          title: "Algo salio mal",
          description: error instanceof Error ? error.message : "No se pudo completar la configuracion.",
          variant: "destructive",
        });
      }
    });
  };

  const renderExistingAgreement = () => (
    <section className="space-y-5">
      <div>
        <h3 className="text-lg font-black tracking-tight">Asignar un convenio existente</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ideal cuando el cliente encaja en una configuracion comercial que ya usas.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Convenio disponible</Label>
        <Select onValueChange={value => setSelectedAgreementId(value === "__none__" ? null : value)} value={selectedAgreementId ?? "__none__"}>
          <SelectTrigger className="h-12 rounded-2xl">
            <SelectValue placeholder="Selecciona un convenio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sin convenio</SelectItem>
            {agreements.map(agreement => (
              <SelectItem key={agreement.id} value={agreement.id}>
                {agreement.agreement_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );

  const renderStepCards = () => (
    <div className="grid gap-2 sm:grid-cols-4">
      {wizardSteps.slice(1).map(item => {
        const isActive = item.id === step;
        const isCompleted = item.id < step;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id <= step) setStep(item.id as WizardStep);
            }}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition",
              isActive && "border-primary bg-primary/10",
              isCompleted && "border-primary/30 bg-primary/5",
              !isActive && !isCompleted && "border-border/60 bg-muted/30"
            )}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Paso {item.id + 1}</div>
            <div className="mt-1 text-sm font-bold">{item.title}</div>
          </button>
        );
      })}
    </div>
  );

  const renderBaseStep = () => (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Nombre del convenio</Label>
          <Input value={agreementName} onChange={event => setAgreementName(event.target.value)} placeholder="Ej: Distribuidor Zona Norte" className="h-12 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Tipo de cliente</Label>
          <Select value={clientType} onValueChange={value => setClientType(value as ClientType)}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="barberia">Barberia</SelectItem>
              <SelectItem value="distribuidor">Distribuidor</SelectItem>
              <SelectItem value="especial">Especial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPriceListMode("existing")}
          className={cn("rounded-3xl border p-4 text-left transition", priceListMode === "existing" ? "border-primary bg-primary/10" : "border-border/60 bg-card")}
        >
          <div className="text-sm font-black">Usar lista existente</div>
          <p className="mt-1 text-sm text-muted-foreground">Aprovecha una lista ya armada y aceleras el alta.</p>
        </button>
        <button
          type="button"
          onClick={() => setPriceListMode("new")}
          className={cn("rounded-3xl border p-4 text-left transition", priceListMode === "new" ? "border-primary bg-primary/10" : "border-border/60 bg-card")}
        >
          <div className="text-sm font-black">Crear lista nueva</div>
          <p className="mt-1 text-sm text-muted-foreground">Util cuando este cliente necesita precios diferentes.</p>
        </button>
        <button
          type="button"
          onClick={() => setPriceListMode("clone")}
          className={cn("rounded-3xl border p-4 text-left transition sm:col-span-2", priceListMode === "clone" ? "border-primary bg-primary/10" : "border-border/60 bg-card")}
        >
          <div className="text-sm font-black">Clonar y ajustar una lista</div>
          <p className="mt-1 text-sm text-muted-foreground">Partes de una lista existente y aplicas un descuento o ajuste general sin cargar todo de cero.</p>
        </button>
      </div>

      {priceListMode === "existing" ? (
        <div className="space-y-2">
          <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Lista de precios</Label>
          <Select onValueChange={value => setSelectedPriceListId(value === "__none__" ? null : value)} value={selectedPriceListId ?? "__none__"}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Selecciona una lista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Seleccionar despues</SelectItem>
              {priceLists.map(priceList => (
                <SelectItem key={priceList.id} value={priceList.id}>
                  {priceList.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {priceListMode === "new" ? (
        <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/30 p-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Nombre de la nueva lista</Label>
            <Input value={newPriceListName} onChange={event => setNewPriceListName(event.target.value)} placeholder="Ej: Lista exclusiva Barberia Central" className="h-12 rounded-2xl" />
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4">
            <Checkbox checked={newPriceListIncludesVat} onCheckedChange={checked => setNewPriceListIncludesVat(Boolean(checked))} />
            <div>
              <div className="text-sm font-semibold">Los precios incluyen IVA</div>
              <p className="mt-1 text-sm text-muted-foreground">Puedes dejarlo listo desde el alta sin volver a configurar esto despues.</p>
            </div>
          </label>
        </div>
      ) : null}

      {priceListMode === "clone" ? (
        <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/30 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Nombre de la lista derivada</Label>
              <Input value={newPriceListName} onChange={event => setNewPriceListName(event.target.value)} placeholder="Ej: Lista barberia premium marzo" className="h-12 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Lista base</Label>
              <Select onValueChange={value => setCloneBasePriceListId(value === "__none__" ? null : value)} value={cloneBasePriceListId ?? "__none__"}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue placeholder="Selecciona una lista base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Elegir lista</SelectItem>
                  {priceLists.map(priceList => (
                    <SelectItem key={priceList.id} value={priceList.id}>
                      {priceList.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Ajuste porcentual</Label>
              <Input value={cloneDiscountPercentage} onChange={event => setCloneDiscountPercentage(event.target.value)} placeholder="0 para copiar igual, 10 para bajar 10%" className="h-12 rounded-2xl" />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4">
            <Checkbox checked={newPriceListIncludesVat} onCheckedChange={checked => setNewPriceListIncludesVat(Boolean(checked))} />
            <div>
              <div className="text-sm font-semibold">La nueva lista incluye IVA</div>
              <p className="mt-1 text-sm text-muted-foreground">La clonacion copia productos y precios ajustados a la nueva lista.</p>
            </div>
          </label>
        </div>
      ) : null}
    </section>
  );

  const renderPromotionsStep = () => (
    <section className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-black tracking-tight">Promociones del convenio</h3>
          <p className="mt-1 text-sm text-muted-foreground">Puedes usar promociones existentes o dejar nuevas listas para crearse junto con el convenio.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {promotions.map(promotion => (
            <ResourceChip key={promotion.id} label={promotion.name} selected={selectedPromotionIds.includes(promotion.id)} onClick={() => toggleSelection(promotion.id, selectedPromotionIds, setSelectedPromotionIds)} />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Crear promocion rapida
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input value={promotionDraft.name} onChange={event => setPromotionDraft(current => ({ ...current, name: event.target.value }))} placeholder="Nombre de la promocion" className="h-12 rounded-2xl" />
          <Select value={promotionDraft.type} onValueChange={value => setPromotionDraft(current => ({ ...current, type: value as PromotionDraftType }))}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy_x_get_y_free">Lleva X y recibe Y</SelectItem>
              <SelectItem value="free_shipping">Envio gratis</SelectItem>
              <SelectItem value="min_amount_discount">Descuento por monto</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-2">
            <Input value={promotionDraft.description} onChange={event => setPromotionDraft(current => ({ ...current, description: event.target.value }))} placeholder="Descripcion breve" className="h-12 rounded-2xl" />
          </div>
          {promotionDraft.type === "buy_x_get_y_free" ? (
            <>
              <Input value={promotionDraft.buy} onChange={event => setPromotionDraft(current => ({ ...current, buy: event.target.value }))} placeholder="Compra" className="h-12 rounded-2xl" />
              <Input value={promotionDraft.get} onChange={event => setPromotionDraft(current => ({ ...current, get: event.target.value }))} placeholder="Regalo" className="h-12 rounded-2xl" />
            </>
          ) : null}
          {promotionDraft.type === "free_shipping" ? (
            <>
              <Input value={promotionDraft.minUnits} onChange={event => setPromotionDraft(current => ({ ...current, minUnits: event.target.value }))} placeholder="Unidades minimas" className="h-12 rounded-2xl" />
              <Input value={promotionDraft.locations} onChange={event => setPromotionDraft(current => ({ ...current, locations: event.target.value }))} placeholder="Localidades separadas por coma" className="h-12 rounded-2xl" />
            </>
          ) : null}
          {promotionDraft.type === "min_amount_discount" ? (
            <>
              <Input value={promotionDraft.minAmount} onChange={event => setPromotionDraft(current => ({ ...current, minAmount: event.target.value }))} placeholder="Monto minimo" className="h-12 rounded-2xl" />
              <Input value={promotionDraft.percentage} onChange={event => setPromotionDraft(current => ({ ...current, percentage: event.target.value }))} placeholder="Porcentaje" className="h-12 rounded-2xl" />
            </>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" className="h-11 rounded-2xl" disabled={!isValidPromotionDraft(promotionDraft)} onClick={() => {
            setPromotionDrafts(current => [...current, promotionDraft]);
            setPromotionDraft(emptyPromotionDraft());
          }}>
            Agregar al convenio
          </Button>
        </div>

        {promotionDrafts.length > 0 ? (
          <div className="mt-4 space-y-2">
            {promotionDrafts.map((draft, index) => (
              <div key={`${draft.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{draft.name}</div>
                  <div className="text-xs text-muted-foreground">{draft.type === "buy_x_get_y_free" ? `Compra ${draft.buy} y recibe ${draft.get}` : draft.type === "free_shipping" ? `Envio gratis desde ${draft.minUnits} unidades` : `Descuento ${draft.percentage}% desde ${draft.minAmount}`}</div>
                </div>
                <Button type="button" variant="ghost" onClick={() => setPromotionDrafts(current => current.filter((_, itemIndex) => itemIndex !== index))}>
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );

  const renderSalesConditionsStep = () => (
    <section className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-black tracking-tight">Condiciones de venta</h3>
          <p className="mt-1 text-sm text-muted-foreground">Define si el cliente paga al contado, con descuento, a plazo o con un esquema especial.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {salesConditions.map(condition => (
            <ResourceChip key={condition.id} label={condition.name} selected={selectedSalesConditionIds.includes(condition.id)} onClick={() => toggleSelection(condition.id, selectedSalesConditionIds, setSelectedSalesConditionIds)} />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Crear condicion rapida
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input value={salesConditionDraft.name} onChange={event => setSalesConditionDraft(current => ({ ...current, name: event.target.value }))} placeholder="Nombre de la condicion" className="h-12 rounded-2xl" />
          <Select value={salesConditionDraft.type} onValueChange={value => setSalesConditionDraft(current => ({ ...current, type: value as SalesConditionDraftType }))}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="net_days">Plazo en dias</SelectItem>
              <SelectItem value="discount">Descuento</SelectItem>
              <SelectItem value="installments">Cuotas</SelectItem>
              <SelectItem value="split_payment">Pago dividido</SelectItem>
              <SelectItem value="cash_on_delivery">Contra reembolso</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-2">
            <Input value={salesConditionDraft.description} onChange={event => setSalesConditionDraft(current => ({ ...current, description: event.target.value }))} placeholder="Descripcion breve" className="h-12 rounded-2xl" />
          </div>
          {salesConditionDraft.type === "net_days" ? <Input value={salesConditionDraft.days} onChange={event => setSalesConditionDraft(current => ({ ...current, days: event.target.value }))} placeholder="Dias de plazo" className="h-12 rounded-2xl" /> : null}
          {salesConditionDraft.type === "discount" ? <Input value={salesConditionDraft.discountPercentage} onChange={event => setSalesConditionDraft(current => ({ ...current, discountPercentage: event.target.value }))} placeholder="Porcentaje de descuento" className="h-12 rounded-2xl" /> : null}
          {salesConditionDraft.type === "installments" ? <Input value={salesConditionDraft.installments} onChange={event => setSalesConditionDraft(current => ({ ...current, installments: event.target.value }))} placeholder="Cantidad de cuotas" className="h-12 rounded-2xl" /> : null}
          {salesConditionDraft.type === "split_payment" ? (
            <>
              <Input value={salesConditionDraft.initialPercentage} onChange={event => setSalesConditionDraft(current => ({ ...current, initialPercentage: event.target.value }))} placeholder="% de adelanto" className="h-12 rounded-2xl" />
              <Input value={salesConditionDraft.remainingDays} onChange={event => setSalesConditionDraft(current => ({ ...current, remainingDays: event.target.value }))} placeholder="Dias restantes" className="h-12 rounded-2xl" />
            </>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" className="h-11 rounded-2xl" disabled={!isValidSalesConditionDraft(salesConditionDraft)} onClick={() => {
            setSalesConditionDrafts(current => [...current, salesConditionDraft]);
            setSalesConditionDraft(emptySalesConditionDraft());
          }}>
            Agregar al convenio
          </Button>
        </div>

        {salesConditionDrafts.length > 0 ? (
          <div className="mt-4 space-y-2">
            {salesConditionDrafts.map((draft, index) => (
              <div key={`${draft.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">{draft.name}</div>
                  <div className="text-xs text-muted-foreground">{draft.type === "net_days" ? `${draft.days} dias` : draft.type === "discount" ? `${draft.discountPercentage}% de descuento` : draft.type === "installments" ? `${draft.installments} cuotas` : draft.type === "split_payment" ? `${draft.initialPercentage}% + saldo a ${draft.remainingDays} dias` : "Pago contra reembolso"}</div>
                </div>
                <Button type="button" variant="ghost" onClick={() => setSalesConditionDrafts(current => current.filter((_, itemIndex) => itemIndex !== index))}>
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );

  const renderReviewStep = () => (
    <section className="space-y-4">
      <div className="rounded-3xl border border-border/60 bg-muted/30 p-5">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Resumen comercial</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Cliente</div>
            <div className="mt-1 text-sm font-semibold">{client.contact_name || client.email || "Cliente sin nombre"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Convenio</div>
            <div className="mt-1 text-sm font-semibold">{agreementSummary.agreement}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lista de precios</div>
            <div className="mt-1 text-sm font-semibold">{agreementSummary.priceList}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tipo</div>
            <div className="mt-1 text-sm font-semibold capitalize">{clientType}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Promociones</div>
          <div className="mt-2 text-2xl font-black">{agreementSummary.promotions}</div>
          <p className="mt-1 text-sm text-muted-foreground">Entre seleccionadas y creadas en este wizard.</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Condiciones</div>
          <div className="mt-2 text-2xl font-black">{agreementSummary.salesConditions}</div>
          <p className="mt-1 text-sm text-muted-foreground">Listas para quedar asociadas al nuevo convenio.</p>
        </div>
      </div>

      {promotionDrafts.length > 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Promociones nuevas</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {promotionDrafts.map((draft, index) => (
              <span key={`${draft.name}-${index}`} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {draft.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {salesConditionDrafts.length > 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Condiciones nuevas</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {salesConditionDrafts.map((draft, index) => (
              <span key={`${draft.name}-${index}`} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {draft.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );

  const renderCustomWizard = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-5 pb-4 pt-4 sm:px-6">{renderStepCards()}</div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-5 sm:p-6">
          <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">{wizardSteps[step].title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{wizardSteps[step].description}</p>
            {step > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {[agreementSummary.agreement, agreementSummary.priceList].map(item => (
                  <span key={item} className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {step === 1 ? renderBaseStep() : null}
          {step === 2 ? renderPromotionsStep() : null}
          {step === 3 ? renderSalesConditionsStep() : null}
          {step === 4 ? renderReviewStep() : null}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[min(92vh,920px)] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
          <DialogTitle className="text-2xl font-black tracking-tight">Configurar convenio del cliente</DialogTitle>
          <DialogDescription className="max-w-3xl text-sm">
            Asigna un convenio existente o crea uno nuevo con lista de precios, promociones y condiciones de venta sin salir del flujo del cliente.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-border/60 px-5 py-4 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("existing");
                      setStep(0);
                    }}
                    className={cn("rounded-3xl border p-4 text-left transition", mode === "existing" ? "border-primary bg-primary/10" : "border-border/60 bg-card")}
                  >
                    <div className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Camino rapido</div>
                    <div className="mt-1 text-lg font-black tracking-tight">Asignar convenio ya creado</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("custom");
                      setStep(1);
                    }}
                    className={cn("rounded-3xl border p-4 text-left transition", mode === "custom" ? "border-primary bg-primary/10" : "border-border/60 bg-card")}
                  >
                    <div className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Camino guiado</div>
                    <div className="mt-1 text-lg font-black tracking-tight">Crear convenio a medida</div>
                  </button>
                </div>
              </div>

              {mode === "existing" ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="p-5 sm:p-6">{renderExistingAgreement()}</div>
                  </ScrollArea>
                </div>
              ) : (
                renderCustomWizard()
              )}
            </div>

            <DialogFooter className="border-t border-border/60 px-5 py-4 sm:px-6">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">{mode === "custom" ? `Paso ${step} de ${wizardSteps.length - 1}` : "Asignacion directa"}</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="ghost" type="button" className="h-11 rounded-2xl" onClick={goBack}>
                    {mode === "custom" && step > 1 ? "Volver" : "Cancelar"}
                  </Button>
                  {mode === "custom" && step < 4 ? (
                    <Button type="button" className="h-11 rounded-2xl" onClick={goNext}>
                      Continuar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" className="h-11 rounded-2xl" disabled={isSubmitting} onClick={handleSave}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {mode === "existing" ? "Guardar asignacion" : "Crear y asignar convenio"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
