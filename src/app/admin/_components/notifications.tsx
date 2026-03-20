"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck, Clock, GitBranch, Package, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationItem = {
    id: string;
    type: "new_order" | "overdue_order" | "new_client" | "pending_changes";
    title: string;
    description: string;
    clientName?: string;
    amount?: number;
    itemCount?: number;
    createdAt: string;
    href: string;
};

const READ_NOTIFICATIONS_KEY = "admin-notifications-read";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
    const iconClass = "h-4 w-4";

    switch (type) {
        case "new_order":
            return <Package className={iconClass} />;
        case "overdue_order":
            return <Clock className={iconClass} />;
        case "new_client":
            return <UserPlus className={iconClass} />;
        case "pending_changes":
            return <GitBranch className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
}

function NotificationDot({ type }: { type: NotificationItem["type"] }) {
    return (
        <div
            className={cn(
                "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                type === "new_order" && "bg-blue-500/10 text-blue-500",
                type === "overdue_order" && "bg-destructive/10 text-destructive",
                type === "new_client" && "bg-green-500/10 text-green-500",
                type === "pending_changes" && "bg-purple-500/10 text-purple-500"
            )}
        >
            <NotificationIcon type={type} />
        </div>
    );
}

const readStoredNotifications = () => {
    if (typeof window === "undefined") return [] as string[];

    try {
        const raw = window.localStorage.getItem(READ_NOTIFICATIONS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return [];
    }
};

const writeStoredNotifications = (ids: string[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids));
};

export function Notifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { getNotificationItems } = await import("@/app/admin/actions/dashboard.actions");
            const items = await getNotificationItems();
            setNotifications(items);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setReadIds(readStoredNotifications());
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (notifications.length === 0) return;

        const validIds = new Set(notifications.map((item) => item.id));
        const nextReadIds = readIds.filter((id) => validIds.has(id));

        if (nextReadIds.length !== readIds.length) {
            setReadIds(nextReadIds);
            writeStoredNotifications(nextReadIds);
        }
    }, [notifications, readIds]);

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !readIds.includes(notification.id)).length,
        [notifications, readIds]
    );

    const markAllAsRead = () => {
        const nextReadIds = Array.from(new Set([...readIds, ...notifications.map((item) => item.id)]));
        setReadIds(nextReadIds);
        writeStoredNotifications(nextReadIds);
    };

    const markOneAsRead = (notificationId: string) => {
        if (readIds.includes(notificationId)) return;
        const nextReadIds = [...readIds, notificationId];
        setReadIds(nextReadIds);
        writeStoredNotifications(nextReadIds);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            markAllAsRead();
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    ) : null}
                    <span className="sr-only">Abrir notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                            <Bell className="h-4 w-4" />
                            Notificaciones
                            {unreadCount > 0 ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 ? (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={markAllAsRead} title="Marcar como leidas">
                                    <CheckCheck className="h-3 w-3" />
                                </Button>
                            ) : null}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchNotifications} title="Actualizar">
                                <RefreshCw className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <ScrollArea className="max-h-[400px]">
                        <div className="flex flex-col">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notification) => {
                                    const isUnread = !readIds.includes(notification.id);

                                    return (
                                        <Link
                                            key={notification.id}
                                            href={notification.href}
                                            onClick={() => {
                                                markOneAsRead(notification.id);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex items-start gap-3 border-b border-border/30 px-4 py-3 transition-colors hover:bg-muted/50 last:border-0",
                                                isUnread && "bg-primary/5"
                                            )}
                                        >
                                            <NotificationDot type={notification.type} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <p className="truncate text-sm font-semibold">{notification.title}</p>
                                                        {isUnread ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                                                    </div>
                                                    <span className="shrink-0 text-[10px] text-muted-foreground">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                                                    </span>
                                                </div>
                                                {notification.clientName ? (
                                                    <p className="mt-0.5 text-xs font-medium text-primary">{notification.clientName}</p>
                                                ) : null}
                                                <p className="truncate text-xs text-muted-foreground">{notification.description}</p>
                                                {notification.amount ? (
                                                    <p className="mt-1 text-xs font-bold text-primary">{formatCurrency(notification.amount)}</p>
                                                ) : null}
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                    <p>No hay notificaciones nuevas.</p>
                                    <p className="mt-1 text-xs opacity-60">Te avisaremos cuando haya algo importante.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    {notifications.length > 0 ? (
                        <CardFooter className="border-t border-border/30 px-4 py-2">
                            <p className="w-full text-center text-[10px] text-muted-foreground/60">
                                Las notificaciones se marcan como leidas en este navegador.
                            </p>
                        </CardFooter>
                    ) : null}
                </Card>
            </PopoverContent>
        </Popover>
    );
}
