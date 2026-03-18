'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PortalClient {
    id: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    agreement_id: string | null;
    status: string;
    agreements?: { agreement_name: string } | null;
}

export interface PendingChange {
    id: string;
    change_type: string;
    old_value: string | null;
    new_value: string | null;
    status: string;
    created_at: string;
}

export function usePortalClient() {
    const [client, setClient] = useState<PortalClient | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadClient = useCallback(async () => {
        try {
            const response = await fetch('/api/portal/client');
            if (!response.ok) {
                throw new Error('Error al cargar cliente');
            }
            const data = await response.json();
            setClient(data.client);
            setPendingChanges(data.pendingChanges || []);
            setError(null);
        } catch (err) {
            console.error('Error loading client:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClient();
    }, [loadClient]);

    const refetch = useCallback(() => {
        setIsLoading(true);
        loadClient();
    }, [loadClient]);

    return {
        client,
        pendingChanges,
        isLoading,
        error,
        refetch,
    };
}

export function usePortalOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [agreementId, setAgreementId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            const response = await fetch('/api/portal/orders');
            if (!response.ok) {
                throw new Error('Error al cargar pedidos');
            }
            const data = await response.json();
            setOrders(data.orders || []);
            setAgreementId(data.agreementId);
            setError(null);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const refetch = useCallback(() => {
        setIsLoading(true);
        loadOrders();
    }, [loadOrders]);

    return {
        orders,
        agreementId,
        isLoading,
        error,
        refetch,
    };
}
