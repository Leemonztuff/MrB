
import { redirect } from 'next/navigation';

export default function OldPromotionsPage() {
  redirect('/admin/commercial-settings?tab=promotions');
}
