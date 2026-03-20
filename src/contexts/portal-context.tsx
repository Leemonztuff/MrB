"use client";

import { createContext, useContext, ReactNode } from "react";

export interface PortalClientData {
    id: string;
    contact_name: string | null;
    email: string | null;
    phone?: string | null;
    address: string | null;
    created_at?: string;
    status: string;
    agreement_id: string | null;
    agreements?: { agreement_name: string } | null;
    cuit: string | null;
    delivery_window?: string | null;
    instagram?: string | null;
    contact_dni?: string | null;
    fiscal_status?: string | null;
    portal_token?: string | null;
}

export interface PortalPendingChange {
    id: string;
    change_type: string;
    old_value: string | null;
    new_value: string | null;
    status: string;
    created_at: string;
}

interface PortalContextType {
    isPortalContext: boolean;
    client: PortalClientData | null;
    pendingChanges: PortalPendingChange[];
}

const PortalContext = createContext<PortalContextType>({
    isPortalContext: false,
    client: null,
    pendingChanges: [],
});

export function PortalProvider({
    children,
    isPortalContext,
    client = null,
    pendingChanges = [],
}: {
    children: ReactNode;
    isPortalContext: boolean;
    client?: PortalClientData | null;
    pendingChanges?: PortalPendingChange[];
}) {
    return (
        <PortalContext.Provider value={{ isPortalContext, client, pendingChanges }}>
            {children}
        </PortalContext.Provider>
    );
}

export function usePortalContext() {
    return useContext(PortalContext);
}
