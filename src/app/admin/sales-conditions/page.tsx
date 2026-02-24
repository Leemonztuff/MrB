
import { redirect } from 'next/navigation';

export default function OldSalesConditionsPage() {
  redirect('/admin/commercial-settings?tab=sales-conditions');
}
