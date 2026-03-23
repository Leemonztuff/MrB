"use client";

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
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { Archive, Copy, Link as LinkIcon, MessageCircle } from "lucide-react";
import { openWhatsAppLink, getClientWelcomeMessage, getOnboardingInviteMessage } from "@/lib/whatsapp-utils";

type ClientActionButtonsProps = {
    onArchive: () => void;
    isArchiving: boolean;
    onCopyLink: (link: string | null, message: string, errorMessage?: string) => void;
    orderLink: string | null;
    onboardingLink: string | null;
    editDialog: React.ReactNode;
    agreementDialog: React.ReactNode;
    clientStatus: Client["status"];
    clientName: string;
    whatsappNumber: string;
};

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
    clientStatus,
    clientName,
    whatsappNumber,
}: ClientActionButtonsProps) {
    const handleSendWhatsApp = () => {
        if (!whatsappNumber) return;
        
        let message: string;
        let link: string | null = null;

        switch (clientStatus) {
            case "active":
                link = orderLink;
                message = getClientWelcomeMessage(clientName || "Cliente", link || "");
                break;
            case "pending_onboarding":
                link = onboardingLink;
                message = getOnboardingInviteMessage(clientName || "Cliente", link || "");
                break;
            default:
                return;
        }

        if (link) {
            openWhatsAppLink(whatsappNumber, message);
        }
    };

    const canSendWhatsApp = (clientStatus === "active" && orderLink) || 
                          (clientStatus === "pending_onboarding" && onboardingLink);
    const whatsappLabel = clientStatus === "active" ? "Enviar Link" : 
                         clientStatus === "pending_onboarding" ? "Enviar Invitación" : "";

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
                {editDialog}
                {agreementDialog}
            </div>

            <div className="flex items-center gap-2">
                {canSendWhatsApp && whatsappNumber && (
                    <ActionButton
                        variant="default"
                        onClick={handleSendWhatsApp}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp</span>
                    </ActionButton>
                )}

                {clientStatus === "pending_onboarding" && (
                    <ActionButton
                        variant="outline"
                        disabled={!onboardingLink}
                        onClick={() => onCopyLink(onboardingLink, "Enlace de alta copiado!")}
                        className="border-primary/20 hover:border-primary/40 bg-primary/5"
                    >
                        <Copy className="h-4 w-4" />
                        <span>Copiar {whatsappLabel}</span>
                    </ActionButton>
                )}

                {clientStatus === "active" && (
                    <>
                        <ActionButton
                            variant="outline"
                            disabled={!orderLink}
                            onClick={() => onCopyLink(orderLink, "Link de pedido copiado!")}
                        >
                            <LinkIcon className="h-4 w-4" />
                            <span>Copiar Link</span>
                        </ActionButton>
                    </>
                )}

                {clientStatus === "pending_agreement" && (
                    <span className="text-xs text-muted-foreground italic px-2">
                        Esperando asignación de convenio
                    </span>
                )}
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
                            <AlertDialogTitle className="font-bold">Archivar Cliente?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta accion ocultara al cliente de la lista principal, pero no borrara sus pedidos asociados.
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
    );
}

const ActionButtonWrapper = ({ children, ...props }: { children: React.ReactNode } & React.ComponentProps<typeof ActionButton>) => (
    <ActionButton {...props}>
        {children}
    </ActionButton>
);

export { ActionButtonWrapper, ActionButton };
