
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Sparkles, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { commandParser } from '@/ai/flows/command-parser-flow';
import { upsertPromotion } from '@/app/admin/actions/promotions.actions';
import { upsertPriceList } from '@/app/admin/actions/pricelists.actions';
import { upsertSalesCondition } from '@/app/admin/actions/sales-conditions.actions';

export function CommandParser() {
  const [command, setCommand] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    startTransition(async () => {
      try {
        const result = await commandParser({ command });

        if (!result || !result.entity) {
          throw new Error('La IA no pudo devolver una entidad válida.');
        }

        let upsertPromise;
        const entityName = result.entity;

        switch (entityName) {
          case 'promotion':
            upsertPromise = upsertPromotion(result.data);
            break;
          case 'pricelist':
            // The AI flow returns the full data object, which might include fields
            // not directly in the pricelists table schema (like base_price_list_name).
            // The `upsertPriceList` action is designed to handle this,
            // we just need to pass the data as is.
            upsertPromise = upsertPriceList({ ...result.data, prices_include_vat: true });
            break;
          case 'sales_condition':
            upsertPromise = upsertSalesCondition(result.data);
            break;
          default:
            // This is a type-safe way to handle unexpected entities
            const exhaustiveCheck: never = entityName;
            throw new Error(`Tipo de entidad no reconocido: ${exhaustiveCheck}`);
        }

        const { error } = await upsertPromise;
        if (error) {
          throw new Error(error.message);
        }

        toast({
          title: '¡Éxito!',
          description: `La entidad '${result.entity}' se creó correctamente.`,
        });

        setCommand('');
        router.refresh();
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error de Comando',
          description:
            error.message ||
            'No se pudo interpretar o ejecutar el comando.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex-1 group"
    >
      <Command className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
      <Input
        type="text"
        placeholder='Crear promo 2x1 en Ceras o "nueva lista con 10% off sobre..."'
        className="w-full h-12 rounded-xl glass border-white/10 focus:border-primary/50 pl-10 pr-12 text-sm italic font-medium placeholder:text-muted-foreground/30 transition-all"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        disabled={isPending}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
        disabled={isPending || !command.trim()}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        <span className="sr-only">Ejecutar Comando</span>
      </Button>
    </form>
  );
}
