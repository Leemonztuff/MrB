const PRINT_STORAGE_KEY = 'mrblonde-print-selections';

export type PrintSelection = {
  id: string;
  bundles: number;
};

export function savePrintSelections(selections: PrintSelection[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(selections));
}

export function getPrintSelections(): PrintSelection[] | null {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(PRINT_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearPrintSelections(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PRINT_STORAGE_KEY);
}

export function openPrintPage(selections: PrintSelection[]): void {
  savePrintSelections(selections);
  window.open('/admin/imprimir/rotulos', '_blank');
}
