
import { redirect } from 'next/navigation';

export default function OldPriceListsPage() {
  redirect('/admin/commercial-settings?tab=pricelists');
}
