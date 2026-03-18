
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Package, UserPlus, Clock, RefreshCw, GitBranch } from "lucide-react";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationItem = {
    id: string;
    type: 'new_order' | 'overdue_order' | 'new_client' | 'pending_changes';
    title: string;
    description: string;
    clientName?: string;
    amount?: number;
    itemCount?: number;
    createdAt: string;
    href: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

function NotificationIcon({ type }: { type: NotificationItem['type'] }) {
    const iconClass = "h-4 w-4";
    switch (type) {
        case 'new_order':
            return <Package className={iconClass} />;
        case 'overdue_order':
            return <Clock className={iconClass} />;
        case 'new_client':
            return <UserPlus className={iconClass} />;
        case 'pending_changes':
            return <GitBranch className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
}

function NotificationDot({ type }: { type: NotificationItem['type'] }) {
    return (
        <div className={cn(
            "mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            type === 'new_order' && "bg-blue-500/10 text-blue-500",
            type === 'overdue_order' && "bg-destructive/10 text-destructive",
            type === 'new_client' && "bg-green-500/10 text-green-500",
            type === 'pending_changes' && "bg-purple-500/10 text-purple-500",
        )}>
            <NotificationIcon type={type} />
        </div>
    );
}

export function Notifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { getNotificationItems } = await import('@/app/admin/actions/dashboard.actions');
            const items = await getNotificationItems();
            setNotifications(items);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Abrir notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={fetchNotifications}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </CardHeader>
                    <ScrollArea className="max-h-[400px]">
                        <div className="flex flex-col">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <RefreshCw className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <a
                                        key={notification.id}
                                        href={notification.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                                    >
                                        <NotificationDot type={notification.type} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold text-sm truncate">{notification.title}</p>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            {notification.clientName && (
                                                <p className="text-xs font-medium text-primary mt-0.5">
                                                    {notification.clientName}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground truncate">
                                                {notification.description}
                                            </p>
                                            {notification.amount && (
                                                <p className="text-xs font-bold text-primary mt-1">
                                                    {formatCurrency(notification.amount)}
                                                </p>
                                            )}
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    <Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />
                                    <p>No hay notificaciones nuevas.</p>
                                    <p className="text-xs mt-1 opacity-60">Te avisaremos cuando haya algo importante.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    {notifications.length > 0 && (
                        <CardFooter className="py-2 px-4 border-t border-border/30">
                            <p className="text-[10px] text-muted-foreground/60 text-center w-full">
                                Haz click en una notificación para ir directo al detalle.
                            </p>
                        </CardFooter>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}
