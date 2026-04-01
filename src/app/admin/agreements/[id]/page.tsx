
import Link from "next/link";
import { Edit, FileWarning } from "lucide-react";
import { getAgreementById } from "@/app/admin/actions/agreements.actions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import AgreementPromotionsList from "./_components/agreement-promotions-list";
import { Badge } from "@/components/ui/badge";
import { EntityDialog } from "../../_components/entity-dialog";
import { agreementFormConfig } from "../_components/form-config";
import AgreementSalesConditionsList from "./_components/agreement-sales-conditions-list";
import { AgreementActionsMenu } from "./_components/agreement-actions-menu";
import { BreadcrumbList } from "@/components/shared/breadcrumb";


export default async function AgreementDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { data: agreement, error } = await getAgreementById(id);

    if (error || !agreement) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <FileWarning className="w-12 h-12 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        Convenio no encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        No se pudo encontrar el convenio solicitado o ocurrió un error.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/admin/agreements">Volver a Convenios</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <BreadcrumbList items={[
                { label: 'Admin', href: '/admin' },
                { label: 'Convenios', href: '/admin/commercial-settings?tab=agreements' },
                { label: agreement.agreement_name }
            ]} />
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">{agreement.agreement_name}</h1>
                    <p className="text-muted-foreground capitalize">{agreement.client_type}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <Edit className="h-3.5 w-3.5" />
                            <span>Editar Detalles</span>
                        </Button>
                    </EntityDialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Precios</CardTitle>
                        <CardDescription>La lista de precios que rige este convenio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {agreement.price_lists ? (
                            <div className="flex flex-col gap-2">
                                <div><Badge variant="secondary" className="w-fit text-base">{agreement.price_lists.name}</Badge></div>
                                <Button variant="outline" size="sm" className="w-fit" asChild>
                                    <Link href={`/admin/commercial-settings?tab=pricelists`}>
                                        Ver o Editar Lista
                                    </Link>
                                </Button>
                            </div>

                        ) : (
                            <div className="text-sm text-muted-foreground">
                                <p>No hay una lista de precios asignada.</p>
                                <EntityDialog formConfig={agreementFormConfig} entity={agreement}>
                                    <Button variant="link" className="p-0 h-auto">Asignar una ahora</Button>
                                </EntityDialog>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="flex-grow">
                            <CardTitle>Promociones del Convenio</CardTitle>
                            <CardDescription>
                                Gestiona las promociones aplicables para este convenio.
                            </CardDescription>
                        </div>
                        <AgreementActionsMenu
                            agreementId={agreement.id}
                            type="promotion"
                        />
                    </CardHeader>
                    <CardContent>
                        <AgreementPromotionsList promotions={agreement.agreement_promotions} agreementId={agreement.id} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="flex-grow">
                            <CardTitle>Condiciones de Venta</CardTitle>
                            <CardDescription>
                                Gestiona las condiciones comerciales (pagos, descuentos, etc.).
                            </CardDescription>
                        </div>
                        <AgreementActionsMenu
                            agreementId={agreement.id}
                            type="sales-condition"
                        />
                    </CardHeader>
                    <CardContent>
                        <AgreementSalesConditionsList conditions={agreement.agreement_sales_conditions} agreementId={agreement.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
