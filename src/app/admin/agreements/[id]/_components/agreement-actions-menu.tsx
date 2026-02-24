
"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignPromotionDialog } from "./assign-promotion-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AssignSalesConditionDialog } from "./assign-sales-condition-dialog";

type AgreementActionsMenuProps = {
    agreementId: string;
    type: 'promotion' | 'sales-condition';
}

export function AgreementActionsMenu({ agreementId, type }: AgreementActionsMenuProps) {

    const renderMenuContent = () => {
        if (type === 'promotion') {
            return (
                <AssignPromotionDialog agreementId={agreementId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Asignar o Crear</DropdownMenuItem>
                </AssignPromotionDialog>
            );
        }

        if (type === 'sales-condition') {
            return (
                <AssignSalesConditionDialog agreementId={agreementId}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Asignar o Crear</DropdownMenuItem>
                </AssignSalesConditionDialog>
            );
        }
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Agregar</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acción</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {renderMenuContent()}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
