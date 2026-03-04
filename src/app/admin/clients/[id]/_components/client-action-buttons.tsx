

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

const ActionButton = ({ children, className, variant = "secondary", ...props }: React.ComponentProps<typeof Button>) => (
    <Button
        variant={variant}
        size="sm"
        className={cn(
            "h-9 px-3 gap-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
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
    const portalLink = typeof window !== 'undefined' ? `${window.location.origin}/portal-cliente/login` : null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
                {editDialog}
                {agreementDialog}
            </div>

            <div className="flex items-center gap-2">
                <ActionButton
                    variant="outline"
                    disabled={!onboardingLink || clientStatus !== 'pending_onboarding'}
                    onClick={() => onCopyLink(onboardingLink, 'Enlace de alta copiado!')}
                    className="border-primary/20 hover:border-primary/40 bg-primary/5"
                >
                    <Copy className="h-4 w-4" />
                    <span>Enlace Alta</span>
                </ActionButton>

                <ActionButton
                    variant="outline"
                    disabled={!portalLink}
                    onClick={() => onCopyLink(portalLink, 'Enlace del portal copiado!')}
                >
                    <LinkIcon className="h-4 w-4" />
                    <span>Link Portal</span>
                </ActionButton>

                <ActionButton
                    variant="outline"
                    disabled={!orderLink}
                    onClick={() => onCopyLink(orderLink, 'Enlace de pedido copiado!')}
                >
                    <LinkIcon className="h-4 w-4" />
                    <span>Link Pedido</span>
                </ActionButton>
            </div>

            <div className="ml-auto">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <ActionButton variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Archive className="h-4 w-4" />
                            <span>Archivar</span>
                        </ActionButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass border-white/5">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold">¿Archivar Cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción ocultará al cliente de la lista principal, pero no borrará sus pedidos asociados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-border/50">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onArchive} disabled={isArchiving} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                {isArchiving ? "Archivando..." : "Confirmar Archivo"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

const ActionButtonWrapper = ({ children, ...props }: { children: React.ReactNode } & React.ComponentProps<typeof ActionButton>) => (
    <ActionButton {...props}>
        {children}
    </ActionButton>
);

export { ActionButtonWrapper, ActionButton };
