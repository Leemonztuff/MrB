"use client";

import { useState, useEffect, useCallback, cloneElement } from "react";
import type { PriceList } from "@/types";
import { getPriceLists } from "@/app/admin/actions/pricelists.actions";
import { useFormContext } from "react-hook-form";

// This is a new wrapper component to contain the client-side logic
// of fetching data for the agreement form.

export function AgreementFormFieldsWrapper({ children }: { children: React.ReactNode }) {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const form = useFormContext();

  const fetchPriceLists = useCallback(async () => {
    const { data } = await getPriceLists();
    setPriceLists(data ?? []);
  }, []);

  useEffect(() => {
    fetchPriceLists();
  }, [fetchPriceLists]);
  
  const handlePriceListCreated = useCallback((newPriceList: PriceList) => {
    setPriceLists(current => [...current, newPriceList]);
    form.setValue('price_list_id', newPriceList.id, { shouldValidate: true });
  }, [form]);

  // We pass the fetched data and the callback down to the actual render function
  return cloneElement(children as React.ReactElement, { priceLists, onPriceListCreated: handlePriceListCreated });
}
