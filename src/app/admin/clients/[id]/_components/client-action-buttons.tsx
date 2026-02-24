

"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";
import { Archive, Edit, FilePen, Link as LinkIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type ClientActionButtonsProps = {
    onArchive: () => void;
    isArchiving: boolean;
    onCopyLink: (link: string | null, message: string, errorMessage?: string) => void;
    orderLink: string | null;
    onboardingLink: string | null;
    editDialog: React.ReactNode;
    agreementDialog: React.ReactNode;
    clientStatus: Client['status'];
}

const ActionButton = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => (
    <Button
        variant="secondary"
        className={cn(
            "flex flex-col items-center justify-center h-20 w-full gap-1 p-2 text-center text-xs sm:text-sm",
            className
        )}
        {...props}
    >
        {children}
    </Button>
);

export function ClientActionButtons({ 
    onArchive, 
    isArchiving, 
    onCopyLink, 
    orderLink, 
    onboardingLink,
    editDialog, 
    agreementDialog,
    clientStatus
}: ClientActionButtonsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {editDialog}
            
            {agreementDialog}

            <ActionButton 
                disabled={!onboardingLink || clientStatus !== 'pending_onboarding'}
                onClick={() => onCopyLink(onboardingLink, 'Enlace de alta copiado!')}
            >
                <Copy className="h-5 w-5" />
                <span>Link Alta</span>
            </ActionButton>

            <ActionButton disabled={!orderLink} onClick={() => onCopyLink(orderLink, 'Enlace de pedido copiado!')}>
                <LinkIcon className="h-5 w-5" />
                <span>Link Pedido</span>
            </ActionButton>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <ActionButton variant="destructive" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground">
                        <Archive className="h-5 w-5" />
                        <span>Archivar</span>
                    </ActionButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Archivar Cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción ocultará al cliente de la lista principal, pero no borrará sus pedidos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onArchive} disabled={isArchiving} className="bg-destructive hover:bg-destructive/90">
                            {isArchiving ? "Archivando..." : "Confirmar Archivo"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

const ActionButtonWrapper = ({ children }: { children: React.ReactNode }) => (
     <ActionButton>
        {children}
    </ActionButton>
);

export { ActionButtonWrapper, ActionButton };
