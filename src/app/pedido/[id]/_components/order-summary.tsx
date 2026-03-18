

"use client";

import { useEffect, useTransition, useState } from "react";
import { useCartStore } from "@/hooks/use-cart-store";
import type { CartItem as CartItemType } from "@/types";
import type { BonusInfo } from "@/domain/pricing/calculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Gift, Truck, Percent, CheckCircle, Home, Package } from "lucide-react";
import { submitOrder } from "@/app/actions/user.actions";
import { getPublicWhatsappNumber } from "@/app/admin/actions/settings.actions";
import type { Promotion, SalesCondition } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function formatWhatsAppMessage(
  clientName: string,
  cartItems: CartItemType[],
  totalItems: number,
  subtotal: number,
  discountApplied: number,
  subtotalWithDiscount: number,
  vatAmount: number,
  totalPrice: number,
  orderId: string,
  appliedPromotions: Promotion[],
  bonusInfo: BonusInfo,
  notes?: string
) {
  const itemsText = cartItems
    .map((item) => `• ${item.quantity}x ${item.product.name}`)
    .join("\n");

  const formatCurrency = (value: number) => `$${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = `${baseUrl}/seguimiento/${orderId}`;

  const messageParts = [
    `*✅ PEDIDO REGISTRADO #${orderId.slice(-6).toUpperCase()}* 🚀\n`,
    `👤 *Cliente:*`,
    `${clientName}\n`,
  ];

  if (notes) {
    messageParts.push(`📝 *Nota:*`);
    messageParts.push(`${notes}\n`);
  }

  messageParts.push(`📦 *Detalle del Pedido:* (${totalItems} unidades)`);
  messageParts.push(`${itemsText}\n`);

  if (appliedPromotions.length > 0 || Object.keys(bonusInfo).length > 0) {
    let promotionsText = "✨ *Beneficios Aplicados:* \n";
    const bonusText = Object.values(bonusInfo).map(info =>
      `🎁 *Bonificación:* +${(info as any).bonusQuantity} un. ${(info as any).productName}`
    ).join('\n');

    const discountPromo = appliedPromotions.find(p => p.rules.type === 'min_amount_discount');
    if (discountPromo) {
      promotionsText += `💸 *Descuento:* -${formatCurrency(discountApplied)}\n`;
    }

    if (bonusText) {
      promotionsText += `${bonusText}\n`;
    }

    if (appliedPromotions.some(p => p.rules.type === 'free_shipping')) {
      promotionsText += `🚚 *Envío Gratis*\n`;
    }

    messageParts.push(promotionsText);
  }

  messageParts.push(`💰 *Total a confirmar: ${formatCurrency(totalPrice)}*\n`);
  messageParts.push(`🕒 *Seguimiento y Estado:*`);
  messageParts.push(`${trackingUrl}\n`);
  messageParts.push(`_Mr. Blonde - Distribuidora Oficial_`);

  const message = messageParts.join("\n").trim();

  return encodeURIComponent(message);
}

function AppliedPromotions() {
  const { appliedPromotions, bonusInfo, discountApplied } = useCartStore();

  if (appliedPromotions.length === 0) {
    return null;
  }
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  const bonusEntries = Object.values(bonusInfo);

  return (
    <div className="space-y-4 w-full">
      {appliedPromotions.map(promo => {
        if (promo.rules.type === 'min_amount_discount') {
          return (
            <div key={promo.id} className="p-4 bg-primary/10 border border-primary/20 rounded-xl glass transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Percent className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <p className="font-black italic tracking-tighter text-primary uppercase text-sm">{promo.name}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Ahorraste <span className="text-primary">{formatCurrency(discountApplied)}</span></p>
                </div>
              </div>
            </div>
          )
        }
        if (promo.rules.type === 'buy_x_get_y_free' && bonusEntries.length > 0) {
          return (
            <div key={promo.id} className="p-4 bg-primary/10 border border-primary/20 rounded-xl glass transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <p className="font-black italic tracking-tighter text-primary uppercase text-sm">{promo.name}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Bonificación aplicada:</p>
                  <ul className="mt-2 text-[11px] space-y-1 font-medium italic">
                    {bonusEntries.map(info => (
                      <li key={info.productName} className="flex items-center gap-2">
                        <span className="font-black text-primary not-italic">+{info.bonusQuantity} un.</span>
                        <span className="opacity-80">de {info.productName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        }
        if (promo.rules.type === 'free_shipping') {
          return (
            <div key={promo.id} className="p-4 bg-primary/10 border border-primary/20 rounded-xl glass transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div>
                  <p className="font-black italic tracking-tighter text-primary uppercase text-sm">{promo.name}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{promo.description}</p>
                </div>
              </div>
            </div>
          )
        }
        return null;
      })}
    </div>
  )
}


export function OrderSummary({
  agreementId,
  clientId,
  clientName,
  pricesIncludeVat,
  promotions,
  vatPercentage,
  salesConditions,
}: {
  agreementId: string;
  clientId: string;
  clientName: string;
  pricesIncludeVat: boolean;
  promotions: Promotion[];
  vatPercentage: number;
  salesConditions: SalesCondition[];
}) {
  const { items, totalItems, subtotal, subtotalWithDiscount, discountApplied, discountFromConditions, vatAmount, totalPrice, clearCart, setAgreement, appliedPromotions, appliedConditions, bonusInfo } = useCartStore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    getPublicWhatsappNumber().then(setWhatsappNumber);

  }, []);

  useEffect(() => {
    setAgreement(agreementId, pricesIncludeVat, promotions, vatPercentage, salesConditions ?? []);
  }, [agreementId, pricesIncludeVat, promotions, vatPercentage, salesConditions, setAgreement]);

  const loadRepeatOrder = async () => {
    const params = new URLSearchParams(window.location.search);
    const repeatOrderId = params.get('repeat_order');

    if (!repeatOrderId) return;

    const checkAndLoad = () => {
      const state = useCartStore.getState();
      if (!state.pricesIncludeVat || !state.vatPercentage) {
        setTimeout(checkAndLoad, 300);
        return;
      }

      fetch(`/api/portal/orders/${repeatOrderId}`)
        .then(res => res.json())
        .then(order => {
          if (order && order.order_items) {
            state.clearCart(); // Clear existing cart first
            order.order_items.forEach((item: any) => {
              if (item.products && item.quantity) {
                const productWithPrice = {
                  ...item.products,
                  price: item.price_per_unit ?? 0,
                  volume_price: null
                };
                state.addItem(productWithPrice, item.quantity);
              }
            });
          }
        })
        .catch(err => console.error('Error loading repeat order:', err));

      window.history.replaceState({}, '', window.location.pathname);
    };

    checkAndLoad();
  };

  useEffect(() => {
    loadRepeatOrder();
  }, []);


  const handleSend = () => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de enviar el pedido.",
        variant: "destructive",
      });
      return;
    }
    if (!whatsappNumber) {
      toast({
        title: "Error de configuración",
        description: "El número de WhatsApp no está configurado. Contacta al administrador.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await submitOrder({
        cart: items,
        total: totalPrice,
        agreementId,
        clientId,
        clientName,
        notes: notes,
      });

      if (result.error || !result.data) {
        toast({
          title: "Error al guardar el pedido",
          description: result.error?.message || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
        return;
      }

      const message = formatWhatsAppMessage(
        clientName,
        items,
        totalItems,
        subtotal,
        discountApplied,
        subtotalWithDiscount,
        vatAmount,
        totalPrice,
        result.data.orderId,
        appliedPromotions,
        bonusInfo,
        notes
      );
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, "_blank");

      clearCart();
      setNotes("");
      setOrderSent(true);
      toast({
        title: "Pedido enviado!",
        description: "Tu pedido se ha registrado y enviado por WhatsApp.",
      });
    });
  };

  const hasItems = items.length > 0;
  const formatCurrency = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

  if (!isMounted) {
    return (
      <Card className="glass border-border/50 overflow-hidden shadow-xl animate-pulse">
        <CardHeader className="pb-4">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-white/5 rounded-xl"></div>
        </CardContent>
      </Card>
    );
  }

  if (orderSent) {
    return (
      <Card className="glass border-border/50 overflow-hidden border-primary/30 shadow-xl">
        <CardHeader className="pb-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/20 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-black italic tracking-tighter text-primary">¡Pedido Enviado!</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
            Tu pedido fue registrado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            También puedes ver el historial de tus pedidos y gestionar tu perfil desde el portal de cliente.
          </p>
          <div className="space-y-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/portal">
                <Home className="h-4 w-4 mr-2" />
                Ir al Portal de Cliente
              </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setOrderSent(false)}>
              <Package className="h-4 w-4 mr-2" />
              Hacer Otro Pedido
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-black italic tracking-tighter text-foreground">Resumen de Pedido</CardTitle>
        {hasItems && <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">Revisa tu orden antes de confirmar.</CardDescription>}
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-foreground">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Subtotal</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              {discountApplied > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-destructive/70">Descuento promociones</span>
                  <span className="font-black text-destructive">-{formatCurrency(discountApplied)}</span>
                </div>
              )}
              {discountFromConditions > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400/80">Descuento condiciones</span>
                  <span className="font-black text-green-500">-{formatCurrency(discountFromConditions)}</span>
                </div>
              )}
              {appliedConditions.length > 0 && (
                <div className="flex flex-col gap-1 py-2 bg-green-500/10 rounded-lg px-3 border border-green-500/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-500/80">Condiciones aplicadas:</span>
                  {appliedConditions.map((condition: any) => (
                    <span key={condition.id} className="text-xs text-green-600 dark:text-green-300/80">{condition.description}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center text-foreground">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">IVA ({vatPercentage}%)</span>
                <span className="font-bold">{formatCurrency(vatAmount)}</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Neto</span>
                <span className="font-headline font-black text-2xl text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-1 bg-muted/50 rounded-lg px-3 text-foreground">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Unidades totales</span>
                <span className="font-black italic text-sm">{totalItems}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1 text-foreground">Notas del Pedido (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Instrucciones de entrega o facturación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass border-border/50 focus:border-primary/50 min-h-[100px] text-sm italic font-medium placeholder:text-muted-foreground/30 rounded-xl text-foreground"
              />
            </div>

            <Separator className="bg-border/50" />
            <Button
              onClick={handleSend}
              size="lg"
              className="w-full h-14 gap-3 font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground group transition-all"
              disabled={isPending}
            >
              {isPending ? "Procesando..." : "Enviar por WhatsApp"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground font-black italic tracking-tighter text-lg opacity-40 uppercase">Tu carrito está vacío.</p>
          </div>
        )}
      </CardContent>
      {hasItems && appliedPromotions.length > 0 && (
        <>
          <div className="px-6 pb-2">
            <Separator className="bg-border/50" />
          </div>
          <CardFooter className="flex-col items-start gap-4 p-6 pt-2">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Beneficios Aplicados</h3>
            <AppliedPromotions />
          </CardFooter>
        </>
      )}
    </Card>
  );
}
