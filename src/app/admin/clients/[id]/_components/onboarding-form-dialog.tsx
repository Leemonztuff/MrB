

"use client";

import { useState } from "react";
import type { Client } from "@/types";
import { UpsertClientDialog } from "../../_components/upsert-client-dialog";

export function OnboardingFormDialog({
  children,
  client,
}: {
  children: React.ReactNode;
  client: Client;
}) {
  // This component now acts as a wrapper for the unified dialog in "edit" mode.
  return (
    <UpsertClientDialog client={client}>
        {children}
    </UpsertClientDialog>
  );
}
