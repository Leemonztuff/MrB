"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ProductHighlighter() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");

    useEffect(() => {
        if (productId) {
            // Small timeout to ensure the DOM is ready and accordions might be open 
            // (though in our case they are open by default or controlled)
            const timer = setTimeout(() => {
                const element = document.getElementById(`product-${productId}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    element.classList.add("ring-2", "ring-primary", "ring-offset-4", "ring-offset-background");

                    // Remove highlight after a few seconds
                    setTimeout(() => {
                        element.classList.remove("ring-2", "ring-primary", "ring-offset-4", "ring-offset-background");
                    }, 3000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [productId]);

    return null;
}
