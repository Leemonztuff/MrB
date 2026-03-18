"use client";

import { createContext, useContext, ReactNode } from "react";

interface PortalContextType {
    isPortalContext: boolean;
}

const PortalContext = createContext<PortalContextType>({
    isPortalContext: false,
});

export function PortalProvider({
    children,
    isPortalContext,
}: {
    children: ReactNode;
    isPortalContext: boolean;
}) {
    return (
        <PortalContext.Provider value={{ isPortalContext }}>
            {children}
        </PortalContext.Provider>
    );
}

export function usePortalContext() {
    return useContext(PortalContext);
}
