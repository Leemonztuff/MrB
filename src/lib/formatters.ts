
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

// Argentine provinces for address parsing
const argentinianProvinces = [
    'Buenos Aires', 'CABA', 'Capital Federal', 'Catamarca', 'Chaco', 'Chubut',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
    'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta',
    'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán'
];

/**
 * Parses a full address string into its components.
 * Inverse of formatAddress.
 */
export function parseAddress(address: string | null): {
    street_address: string;
    street_number: string;
    locality: string;
    province: string;
} {
    if (!address) return { street_address: '', street_number: '', locality: '', province: '' };
    
    const parts = address.split(',').map(p => p.trim());
    const province = argentinianProvinces.find(p => p === parts[parts.length - 1]);
    const locality = province && parts[parts.length - 2] ? parts[parts.length - 2] : '';
    const streetAndNumberMatch = (parts[0] || '').match(/^(.*?)(\s+\d+)?$/);
    
    return {
        street_address: streetAndNumberMatch ? streetAndNumberMatch[1] : '',
        street_number: streetAndNumberMatch && streetAndNumberMatch[2] ? streetAndNumberMatch[2].trim() : '',
        locality: locality || '',
        province: province || '',
    };
}

// Delivery days configuration
export const deliveryDays = [
    { id: 'monday', label: 'Lunes', short: 'Lun' },
    { id: 'tuesday', label: 'Martes', short: 'Mar' },
    { id: 'wednesday', label: 'Miércoles', short: 'Mié' },
    { id: 'thursday', label: 'Jueves', short: 'Jue' },
    { id: 'friday', label: 'Viernes', short: 'Vie' },
    { id: 'saturday', label: 'Sábado', short: 'Sáb' },
    { id: 'sunday', label: 'Domingo', short: 'Dom' },
];

/**
 * Parses a delivery window string into its components.
 * Inverse of formatDeliveryWindow.
 */
export function parseDeliveryWindow(deliveryWindow: string | null): {
    days: string[];
    from: string;
    to: string;
} {
    if (!deliveryWindow) return { days: [], from: '09:00', to: '18:00' };
    
    const parts = deliveryWindow.split(' de ');
    if (parts.length < 2) return { days: [], from: '09:00', to: '18:00' };
    
    const dayString = parts[0].toLowerCase();
    const days = deliveryDays
        .filter(day => dayString.includes(day.id.slice(0, 3)))
        .map(day => day.id);

    const timeParts = parts[1].replace('hs', '').split(' a ');
    return {
        days,
        from: timeParts[0] ? `${timeParts[0].padStart(2, '0')}:00` : '09:00',
        to: timeParts[1] ? `${timeParts[1].padStart(2, '0')}:00` : '18:00',
    };
}
