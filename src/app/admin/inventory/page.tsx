
import { getProducts } from "@/app/admin/actions/products.actions";
import { getAllProductsStock } from "@/app/admin/actions/inventory.actions";
import { InventoryTable } from "./_components/inventory-table";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function InventoryPage() {
    const [productsResult, stockResult] = await Promise.all([
        getProducts(),
        getAllProductsStock()
    ]);

    const products = productsResult.data || [];
    const stockMap = stockResult.data || {};

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <PageHeader
                title="Inventario"
                description="Control de stock físico y reservas."
            />

            <Card className="glass border-white/5 overflow-hidden">
                <CardContent className="p-0">
                    <InventoryTable
                        products={products}
                        stockMap={stockMap}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
