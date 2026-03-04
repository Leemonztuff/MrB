
import { getProducts } from "@/app/admin/actions/products.actions";
import { getAllProductsStock } from "@/app/admin/actions/inventory.actions";
import { InventoryTable } from "./_components/inventory-table";
import { PackageSearch } from "lucide-react";

export default async function InventoryPage() {
    const [productsResult, stockResult] = await Promise.all([
        getProducts(),
        getAllProductsStock()
    ]);

    const products = productsResult.data || [];
    const stockMap = stockResult.data || {};

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <PackageSearch className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        Controla el stock físico y las reservas de tus productos.
                    </p>
                </div>
            </div>

            <InventoryTable
                products={products}
                stockMap={stockMap}
            />
        </div>
    );
}
