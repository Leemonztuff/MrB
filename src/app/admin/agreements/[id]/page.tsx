
import Link from "next/link";
import { ArrowLeft, Edit, FileWarning, Landmark, Package, Percent, PlusCircle, Users } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EntityDialog } from "../../_components/entity-dialog";
import { agreementFormConfig } from "../_components/form-config";
import AgreementSalesConditionsList from "./_components/agreement-sales-conditions-list";
import { AgreementActionsMenu } from "./_components/agreement-actions-menu";


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
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/agreements">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Volver</span>
                    </Link>
                </Button>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <Card>
                    <CardHeader>
                        <CardTitle>Clientes Asignados</CardTitle>
                        <CardDescription>
                            Clientes que actualmente utilizan este convenio.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {agreement.clients && agreement.clients.length > 0 ? (
                            <div className="space-y-4">
                                {agreement.clients.map(client => (
                                    <div key={client.id} className="flex items-center gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={`https://avatar.vercel.sh/${client.id}.png`} alt="Avatar" />
                                            <AvatarFallback>{client.contact_name?.charAt(0) ?? 'C'}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <Link href={`/admin/clients/${client.id}`} className="text-sm font-medium leading-none hover:underline">
                                                {client.contact_name}
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-4">
                                <p>No hay clientes asignados a este convenio.</p>
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
