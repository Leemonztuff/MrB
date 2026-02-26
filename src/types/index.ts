export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
};

export type AuthState = {
    error: {
        message: string;
    } | null;
};

export type Product = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
    created_at: string;
};

export type ProductWithPrice = Product & {
    price: number;
    volume_price?: number | null;
};

export type CartItem = {
    product: ProductWithPrice;
    quantity: number;
};

export type { CartItem as CartItemType };

export type Promotion = {
    id: string;
    name: string;
    description: string | null;
    rules: any;
    created_at: string;
};

export type Order = {
    id: string;
    client_id: string | null;
    agreement_id: string | null;
    created_at: string;
    total_amount: number;
    status: 'armado' | 'transito' | 'entregado';
    client_name_cache: string;
    notes?: string | null;
}

export type OrderWithItems = Order & {
    order_items: {
        quantity: number;
        price_per_unit: number;
        products: {
            name: string;
            category: string | null;
            image_url: string | null;
        } | null;
    }[];
    clients?: Client | null;
}

export type Client = {
    id: string;
    contact_name: string | null;
    email: string | null;
    cuit: string | null;
    address: string | null;
    status: 'pending_onboarding' | 'pending_agreement' | 'active' | 'archived';
    onboarding_token: string | null;
    portal_token: string | null;
    agreement_id: string | null;
    delivery_window: string | null;
    instagram?: string | null;
    contact_dni?: string | null;
    fiscal_status?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    created_at?: string;
    agreements?: { agreement_name: string } | null;
}

export type ClientStats = {
    total_spent: number;
    total_orders: number;
    average_order_value: number;
}

export type PendingChange = {
    id: string;
    client_id: string;
    change_type: 'contact_name' | 'email' | 'cuit' | 'address' | 'delivery_window' | 'instagram' | 'contact_dni' | 'fiscal_status';
    old_value: string | null;
    new_value: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
}

export type DashboardStats = {
    total_revenue: number;
    month_revenue: number;
    active_clients: number;
    pending_orders_count: number;
    total_clients: number;
    total_pricelists: number;
    total_promotions: number;
    total_sales_conditions: number;
    overdue_orders_count: number;
}

export type AppSettings = {
    whatsapp_number: string;
    vat_percentage: number;
    logo_url: string | null;
}

export type AppSettingsRow = {
    key: string;
    value: any;
};

export type AnalyzeClientOutput = {
    summary: string;
    observations: string[];
    opportunities: string[];
    risks: string[];
};

export type Agreement = {
    id: string;
    agreement_name: string;
    client_type: 'barberia' | 'distribuidor' | 'especial';
    price_list_id: string | null;
    created_at: string;
};

export type DetailedAgreement = Agreement & {
    agreement_promotions: AgreementPromotion[];
    agreement_sales_conditions: AgreementSalesCondition[];
    price_lists: PriceList | null;
    clients: { id: string; contact_name: string | null }[];
};

export type AgreementWithCount = Agreement & {
    promotion_count: number;
    sales_condition_count: number;
    price_lists: { name: string } | null;
};

export type AgreementPromotion = {
    promotions: Promotion;
};

export type AgreementSalesCondition = {
    sales_conditions: SalesCondition;
};

export type SalesCondition = {
    id: string;
    name: string;
    description: string | null;
    rules: any;
    created_at: string;
};

export type PriceList = {
    id: string;
    name: string;
    prices_include_vat: boolean;
    created_at: string;
};

export type DetailedPriceList = PriceList & {
    price_list_items: PriceListItem[];
};

export type PriceListItem = {
    price_list_id: string;
    product_id: string;
    price: number;
    volume_price: number | null;
    products: Product;
};
