
"use client";

import { MapPin, Mail, Calendar, Instagram, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/types";

interface ClientInfoTabProps {
  client: Client;
}

export function ClientInfoTab({ client }: ClientInfoTabProps) {
  const infoItems = [
    {
      icon: User,
      label: "Nombre de Contacto",
      value: client.contact_name || "No registrado",
    },
    {
      icon: MapPin,
      label: "Dirección",
      value: client.address || "No registrada",
    },
    {
      icon: Mail,
      label: "Email de Contacto",
      value: client.email || "No registrado",
    },
    {
      icon: Calendar,
      label: "Ventana Horaria de Entrega",
      value: client.delivery_window || "No especificada",
    },
    ...(client.instagram ? [{
      icon: Instagram,
      label: "Instagram",
      value: client.instagram,
    }] : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {infoItems.map((item) => (
        <Card key={item.label} className="glass border-white/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <item.icon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
