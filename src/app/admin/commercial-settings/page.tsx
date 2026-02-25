
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import PriceListsTab from './_components/price-lists-tab';
import PromotionsTab from './_components/promotions-tab';
import SalesConditionsTab from './_components/sales-conditions-tab';
import Link from "next/link";
import { ClipboardList, Percent, Landmark } from "lucide-react";
import { CommandParser } from "./_components/command-parser";

const tabsConfig = [
  { value: "pricelists", label: "Listas de Precios", icon: ClipboardList },
  { value: "promotions", label: "Promociones", icon: Percent },
  { value: "sales-conditions", label: "Condiciones", icon: Landmark },
]

export default async function CommercialSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab = tab || "pricelists";

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <PageHeader
        title="Gestión Comercial"
        description="Estructura de precios, promociones y reglas."
      >
        <CommandParser />
      </PageHeader>

      <Tabs value={currentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 glass border-white/5 p-1 rounded-xl mb-6">
          {tabsConfig.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              asChild
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-300 font-black uppercase tracking-widest text-[10px]"
            >
              <Link href={`/admin/commercial-settings?tab=${tab.value}`} className="flex items-center justify-center gap-2 h-full">
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline italic">
                  {tab.label}
                </span>
                <span className="sm:hidden">
                  {tab.label.split(' ')[0]}
                </span>
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pricelists">
          <PriceListsTab />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>
        <TabsContent value="sales-conditions">
          <SalesConditionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
