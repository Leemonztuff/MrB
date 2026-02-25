

"use client";

import { useTransition, useCallback, useEffect, useState } from "react";
import { MoreHorizontal, Archive, Link as LinkIcon, Copy, FilePen } from "lucide-react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteClient } from "@/app/admin/actions/clients.actions";
import type { Client } from "@/types";
import { AssignAgreementDialog } from "./assign-agreement-dialog";
import { cn } from "@/lib/utils";

const statusMap: Record<Client['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_onboarding: { label: "Pendiente de Alta", variant: "secondary" },
  pending_agreement: { label: "Pendiente de Convenio", variant: "destructive" },
  active: { label: "Activo", variant: "default" },
  archived: { label: "Archivado", variant: "outline" },
};

interface ClientsTableProps {
  clients: Client[];
  emptyState: React.ReactNode;
}

export function ClientsTable({ clients, emptyState }: ClientsTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This hook ensures that code depending on `window` only runs on the client
    setIsClient(true);
  }, []);

  const handleArchive = (clientId: string) => {
    startTransition(async () => {
      const result = await deleteClient(clientId);
      if (result.error) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
      } else {
        toast({ title: "Éxito", description: "Cliente archivado correctamente." });
      }
    });
  };

  const copyToClipboard = useCallback((textToCopy: string | null, toastMessage: string, errorMessage?: string) => {
    if (!textToCopy) {
      toast({ title: "No hay enlace para copiar", description: errorMessage || "El recurso no está disponible.", variant: "destructive" });
      return;
    }

    // Defensive check for Clipboard API (might be missing in non-secure contexts or old browsers)
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: toastMessage });
      }).catch(err => {
        console.error('Clipboard write error:', err);
        toast({ title: "Error al copiar", description: "No se pudo acceder al portapapeles.", variant: "destructive" });
      });
    } else {
      // Potencial fallback legacy o error descriptivo
      console.warn('Clipboard API not available');
      toast({ title: "Portapapeles no disponible", description: "Es posible que necesites una conexión segura (HTTPS) para esta función.", variant: "destructive" });
    }
  }, [toast]);

  if (clients.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="grid gap-3 sm:hidden">
        {clients.map((client) => {
          const onboardingLink = isClient ? `${window.location.origin}/onboarding/${client.onboarding_token}` : null;
          return (
            <Card key={client.id} className="glass border-white/5 hover:bg-white/5 transition-all duration-300">
              <Link href={`/admin/clients/${client.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-lg font-black italic tracking-tighter truncate">
                        {client.contact_name || "Cliente pendiente"}
                      </CardTitle>
                      {client.email && (
                        <CardDescription className="text-[10px] truncate uppercase font-bold tracking-widest opacity-60">
                          {client.email}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={statusMap[client.status].variant}
                      className={cn(
                        "text-[8px] uppercase font-black tracking-widest shrink-0 py-0.5 px-2",
                        client.status === 'active' && "bg-primary/20 text-primary border-primary/20"
                      )}
                    >
                      {statusMap[client.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/60">Convenio</p>
                  <p className="font-headline font-black text-primary truncate">{client.agreements?.agreement_name || "Sin asignar"}</p>
                </CardContent>
              </Link>
              <CardFooter className="flex flex-col gap-3 items-stretch p-4 pt-0">
                <AssignAgreementDialog client={client}>
                  <Button variant="default" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/10">
                    <FilePen className="mr-2 h-3.5 w-3.5" />
                    {client.agreement_id ? "Cambiar Convenio" : "Asignar Convenio"}
                  </Button>
                </AssignAgreementDialog>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl bg-white/5 border-white/5 hover:bg-white/10"
                    onClick={() => copyToClipboard(onboardingLink, 'Enlace de alta copiado!')}
                    disabled={client.status !== 'pending_onboarding' || !isClient}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Alta
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 text-[9px] font-black uppercase tracking-widest text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                        <Archive className="mr-2 h-3.5 w-3.5" /> Archivar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass border-white/5">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic">¿Archivar Cliente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Esta acción ocultará al cliente de la lista principal. Podrás verlo en un futuro desde la sección de archivados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleArchive(client.id)}
                          disabled={isPending}
                          className="bg-destructive hover:bg-destructive/90 rounded-xl"
                        >
                          {isPending ? "Archivando..." : "Confirmar Archivo"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Desktop View: Table */}
      <Card className="hidden sm:block glass border-white/5 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Nombre</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Email</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Convenio</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Estado</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const onboardingLink = isClient ? `${window.location.origin}/onboarding/${client.onboarding_token}` : null;
                const orderLink = isClient && client.agreement_id && client.status === 'active' ? `${window.location.origin}/pedido/${client.agreement_id}` : null;
                return (
                  <TableRow key={client.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell className="pl-6 py-4">
                      <Link href={`/admin/clients/${client.id}`} className="font-black italic tracking-tighter text-base hover:text-primary transition-colors">
                        {client.contact_name || "Cliente pendiente..."}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/80 font-medium">{client.email}</TableCell>
                    <TableCell className="font-headline font-black text-primary/80">
                      {client.agreements?.agreement_name || (
                        <span className="text-muted-foreground/40 font-normal italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusMap[client.status].variant}
                        className={cn(
                          "text-[10px] uppercase font-black tracking-widest",
                          client.status === 'active' && "bg-primary/20 text-primary border-primary/20",
                          client.status === 'pending_agreement' && "bg-destructive/20 text-destructive border-destructive/20"
                        )}
                      >
                        {statusMap[client.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/5 min-w-[180px]">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="focus:bg-white/5">
                            <Link href={`/admin/clients/${client.id}`} className="cursor-pointer font-bold py-2">Ver Detalles</Link>
                          </DropdownMenuItem>
                          <AssignAgreementDialog client={client}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-white/5 cursor-pointer font-bold py-2">
                              {client.agreement_id ? "Cambiar Convenio" : "Asignar Convenio"}
                            </DropdownMenuItem>
                          </AssignAgreementDialog>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(orderLink, 'Enlace de pedido copiado!', 'El cliente debe estar activo para tener un enlace de pedido.')}
                            disabled={!orderLink}
                            className="focus:bg-white/5 cursor-pointer font-bold py-2"
                          >
                            <LinkIcon className="mr-2 h-4 w-4 text-primary" />
                            Copiar Link Pedido
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(onboardingLink, 'Enlace de alta copiado!')}
                            disabled={client.status !== 'pending_onboarding' || !isClient}
                            className="focus:bg-white/5 cursor-pointer font-bold py-2"
                          >
                            <Copy className="mr-2 h-4 w-4 text-primary" />
                            Copiar Link de Alta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold py-2"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archivar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass border-white/5">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black italic">¿Archivar Cliente?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                  Esta acción ocultará al cliente de la lista principal. Podrás verlo en un futuro desde la sección de archivados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleArchive(client.id)}
                                  disabled={isPending}
                                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                >
                                  {isPending ? "Archivando..." : "Confirmar Archivo"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="px-6 py-4 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Mostrando <strong className="text-foreground">{clients.length}</strong> de <strong className="text-foreground">{clients.length}</strong> clientes.
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
