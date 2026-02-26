
/**
 * Formats currency in Argentine Pesos (ARS).
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(amount);
}

/**
 * Formats a physical address from its components.
 */
export function formatAddress(data: {
    street_address?: string;
    street_number?: string;
    locality?: string;
    province?: string;
}): string {
    const parts = [];
    if (data.street_address) {
        let street = data.street_address;
        if (data.street_number) street += ` ${data.street_number}`;
        parts.push(street);
    }
    if (data.locality) parts.push(data.locality);
    if (data.province) parts.push(data.province);

    return parts.join(", ");
}

/**
 * Formats a delivery window string.
 */
export function formatDeliveryWindow(data: {
    delivery_days?: string[];
    delivery_time_from?: string;
    delivery_time_to?: string;
}): string {
    if (!data.delivery_days?.length || !data.delivery_time_from || !data.delivery_time_to) {
        return "";
    }
    return `${data.delivery_days.join(", ")} de ${data.delivery_time_from} a ${data.delivery_time_to}hs`;
}

/**
 * Formats a date string into a human-readable format.
 */
export function formatDate(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("es-AR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formats a CUIT number with dashes (ej: 20-31895155-2)
 */
export function formatCuit(cuit: string | null | undefined): string {
    if (!cuit || cuit.length !== 11) return '';
    return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

/**
 * Removes dashes from a formatted CUIT
 */
export function unformatCuit(cuit: string): string {
    return cuit.replace(/-/g, '');
}
