import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { CategoriesTable } from './_components/categories-table';
import { CategoryDialog, CreateCategoryTrigger } from './_components/form-config';
import { getCategories } from './actions/categories.actions';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  const categoriesResult = await getCategories();
  const categories = categoriesResult.success ? categoriesResult.data ?? [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        description="Gestiona las categorías de productos"
      />
      
      <CategoriesTable categories={categories} />
    </div>
  );
}