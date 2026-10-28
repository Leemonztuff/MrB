import { describe, expect, it } from "vitest";
import { buildWizardSteps, getWizardProgress, type WizardCounts } from "./wizard";

const emptyCounts: WizardCounts = {
  products: 0,
  priceLists: 0,
  agreements: 0,
  clients: 0,
  orders: 0,
};

describe("wizard", () => {
  it("keeps the recommended learning order", () => {
    const steps = buildWizardSteps(emptyCounts);

    expect(steps.map(step => step.id)).toEqual([
      "products",
      "price-list",
      "agreement",
      "client",
      "order",
    ]);
  });

  it("marks each step from its own count", () => {
    const steps = buildWizardSteps({
      products: 3,
      priceLists: 1,
      agreements: 0,
      clients: 2,
      orders: 0,
    });

    expect(steps.map(step => step.completed)).toEqual([true, true, false, true, false]);
  });

  it("points to the first incomplete step", () => {
    const steps = buildWizardSteps({
      products: 1,
      priceLists: 1,
      agreements: 0,
      clients: 0,
      orders: 0,
    });

    const progress = getWizardProgress(steps);

    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(5);
    expect(progress.next?.id).toBe("agreement");
    expect(progress.isComplete).toBe(false);
  });

  it("reports completion when every step is done", () => {
    const steps = buildWizardSteps({
      products: 1,
      priceLists: 1,
      agreements: 1,
      clients: 1,
      orders: 1,
    });

    const progress = getWizardProgress(steps);

    expect(progress.completed).toBe(5);
    expect(progress.next).toBeNull();
    expect(progress.isComplete).toBe(true);
  });
});
