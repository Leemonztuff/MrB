
"use client";

import { useState } from "react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, Package, UserPlus, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Notification = {
    id: string;
    type: 'order' | 'client' | 'overdue' | 'change';
    title: string;
    description: string;
    createdAt: Date;
}

const getNotificationConfig = (notification: Notification) => {
    switch (notification.type) {
        case 'order':
            return {
                icon: Package,
                href: `/admin`,
                bgColorClass: "bg-blue-500",
            };
        case 'client':
            return {
                icon: UserPlus,
                href: `/admin/clients`,
                bgColorClass: "bg-green-500",
            };
        case 'overdue':
             return {
                icon: Clock,
                href: `/admin`, // Could link to a specific "overdue" page later
                bgColorClass: "bg-amber-500",
            };
        case 'change':
            return {
                icon: UserPlus,
                href: `/admin/clients?filter=pending-changes`,
                bgColorClass: "bg-purple-500",
            };
        default:
            return {
                icon: Bell,
                href: '#',
                bgColorClass: "bg-primary"
            }
    }
}


export function Notifications({ notifications }: { notifications: Notification[]}) {
  const [hasUnread, setHasUnread] = useState(notifications.length > 0);

  const handleMarkAsRead = () => {
    setHasUnread(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notificaciones</CardTitle>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAsRead}
                className="h-auto p-1 text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                Marcar como leídas
              </Button>
            )}
          </CardHeader>
          <ScrollArea className="h-96">
            <div className="flex flex-col gap-1 p-2">
                {notifications.length > 0 ? (
                    notifications.map((notification) => {
                        const { icon: Icon, href, bgColorClass } = getNotificationConfig(notification);
                        return (
                            <Link key={notification.id} href={href} className="block rounded-lg hover:bg-muted/50 p-2">
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-1 flex h-2 w-2 translate-y-1.5 shrink-0 rounded-full", bgColorClass)} />
                                    <div className="grid gap-0.5">
                                        <p className="font-semibold text-sm">{notification.title}</p>
                                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                                        <p className="text-xs text-muted-foreground/70">
                                            {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                ) : (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                        <Bell className="mx-auto h-8 w-8 mb-2" />
                        <p>No hay notificaciones nuevas.</p>
                    </div>
                )}
            </div>
          </ScrollArea>
           {notifications.length > 0 && (
             <CardFooter>
                <p className="text-xs text-muted-foreground/80 text-center w-full">
                    Mostrando las últimas {notifications.length} notificaciones.
                </p>
            </CardFooter>
           )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
