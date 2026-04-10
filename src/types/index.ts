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

export type ProductCategory = 'cabello' | 'barba' | 'merch';

export type Category = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Categories = ProductCategory;

export type Product = {
    id: string;
    name: string;
    description: string | null;
    category: ProductCategory | null;
    category_id?: string | null;
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

// Promotion rule types
export type BuyXGetYRules = {
    type: 'buy_x_get_y_free';
    buy: number;
    get: number;
    // Legacy fields (deprecated - use application_scope instead)
    product_ids?: string[];
    category_names?: string[];
};

export type FreeShippingRules = {
    type: 'free_shipping';
    min_units: number;
    locations?: string[];
};

export type MinAmountDiscountRules = {
    type: 'min_amount_discount';
    min_amount: number;
    percentage: number;
};

export type PromotionRules = BuyXGetYRules | FreeShippingRules | MinAmountDiscountRules;

export type Promotion = {
    id: string;
    name: string;
    description: string | null;
    rules: PromotionRules | null;
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
        price_per_unit?: number;
        products: {
            name: string;
            category?: string | null;
            image_url?: string | null;
        } | null;
    }[];
    clients?: Client | null;
}

export type Client = {
    id: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
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
    agreements?: { agreement_name: string; client_type?: 'barberia' | 'distribuidor' | 'especial' } | null;
}

export type ClientStats = {
    total_spent: number;
    total_orders: number;
    average_order_value: number;
}

export type PendingChange = {
    id: string;
    client_id: string;
    change_type: 'contact_name' | 'email' | 'phone' | 'cuit' | 'address' | 'delivery_window' | 'instagram' | 'contact_dni' | 'fiscal_status';
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
    enable_stock_management: boolean;
}

export type AppSettingsRow = {
    key: string;
    value: string | number | boolean | null;
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
    // Scope de aplicación - define dónde aplica esta promoción en el acuerdo
    application_scope?: PromotionApplicationScope;
};

// Scope de aplicación de promoción en un acuerdo
export type PromotionApplicationScope = 
    | { type: 'all' }
    | { type: 'category'; category: ProductCategory }
    | { type: 'products'; product_ids: string[] };

// Catálogo de productos específicos con promoción especial
export type ProductPromotionOverride = {
    product_id: string;
    promotion: Promotion;
};

export type AgreementSalesCondition = {
    sales_conditions: SalesCondition;
};

// SalesCondition rule types
export type DiscountRules = {
    type: 'discount';
    discount: {
        percentage: number;
    };
};

export type MinOrderAmountRules = {
    type: 'min_order_amount';
    min_order_amount: {
        minimum: number;
    };
};

export type NetDaysRules = {
    type: 'net_days';
    net_days: {
        days: number;
    };
};

export type CashOnDeliveryRules = {
    type: 'cash_on_delivery';
};

export type InstallmentsRules = {
    type: 'installments';
    installments: {
        installments: number;
    };
};

export type SplitPaymentRules = {
    type: 'split_payment';
    split_payment: {
        initial_percentage: number;
        remaining_days: number;
    };
};

export type SalesConditionRules = 
    | DiscountRules 
    | MinOrderAmountRules 
    | NetDaysRules 
    | CashOnDeliveryRules 
    | InstallmentsRules 
    | SplitPaymentRules;

export type SalesCondition = {
    id: string;
    name: string;
    description: string | null;
    rules: SalesConditionRules | null;
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

export type PriceListProductPromotion = {
    price_list_id: string;
    product_id: string;
    promotion_id: string;
    promotions?: Promotion;
};

export type NewsPost = {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    is_active: boolean;
    display_order: number;
    starts_at: string | null;
    ends_at: string | null;
    promotion_id: string | null;
    target_client_type: 'barberia' | 'distribuidor' | 'especial' | null;
    created_at: string;
    updated_at: string;
    likes_count?: number;
    liked_by_current_client?: boolean;
};
