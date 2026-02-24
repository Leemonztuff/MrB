
'use server';
/**
 * @fileOverview Un agente de IA que interpreta comandos en lenguaje natural para crear entidades comerciales.
 *
 * - commandParser: La función principal que interpreta el comando y le pasa contexto dinámico a la IA.
 * - CommandParserInput: El tipo de entrada para el flujo.
 * - CommandParserOutput: El tipo de salida del flujo, que puede ser una promoción, una lista de precios o una condición de venta.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getPriceLists } from '@/app/admin/actions/pricelists.actions';


// --- Input Schema ---
const CommandParserInputSchema = z.object({
  command: z.string().describe('El comando en lenguaje natural ingresado por el usuario.'),
});
export type CommandParserInput = z.infer<typeof CommandParserInputSchema>;

// --- Output Schemas ---

// Esquema para Promoción
const PromotionRuleSchema = z.object({
  type: z.enum(['buy_x_get_y_free', 'free_shipping', 'min_amount_discount']),
  buy: z.number().optional(),
  get: z.number().optional(),
  min_units: z.number().optional(),
  locations: z.array(z.string()).optional(),
  min_amount: z.number().optional(),
  percentage: z.number().optional(),
}).describe('Las reglas específicas de la promoción.');

const ParsedPromotionSchema = z.object({
  entity: z.enum(['promotion']),
  data: z.object({
    name: z.string().describe('Un nombre corto y descriptivo para la promoción.'),
    description: z.string().describe('Una descripción un poco más detallada.'),
    rules: PromotionRuleSchema,
  }),
}).describe('Una entidad de promoción, creada a partir del comando.');


// Esquema para Lista de Precios
const ParsedPriceListSchema = z.object({
    entity: z.enum(['pricelist']),
    data: z.object({
        name: z.string().describe('Un nombre descriptivo para la nueva lista de precios.'),
        base_price_list_id: z.string().uuid().describe("El ID de la lista de precios base sobre la cual se aplicará el descuento. Debes encontrar este ID en el contexto de 'priceLists' que se te provee."),
        discount_percentage: z.number().min(0).max(100).describe('El porcentaje de descuento a aplicar sobre la lista base (ej: 15 para 15%).'),
    }),
}).describe('Una nueva lista de precios creada con un descuento sobre una existente.');


// Esquema para Condición de Venta
const SalesConditionRuleSchema = z.object({
    type: z.enum(['net_days', 'discount', 'installments', 'split_payment', 'cash_on_delivery']),
    days: z.number().optional(),
    percentage: z.number().optional(),
    installments: z.number().optional(),
    initial_percentage: z.number().optional(),
    remaining_days: z.number().optional(),
}).describe('Las reglas específicas para la condición de venta.');

const ParsedSalesConditionSchema = z.object({
    entity: z.enum(['sales_condition']),
    data: z.object({
        name: z.string().describe('Un nombre corto y descriptivo para la condición de venta.'),
        description: z.string().describe('Una descripción un poco más detallada.'),
        rules: SalesConditionRuleSchema,
    }),
}).describe('Una condición de venta creada a partir del comando.');


// Esquema de Salida Unificado
const CommandParserOutputSchema = z.union([
    ParsedPromotionSchema,
    ParsedPriceListSchema,
    ParsedSalesConditionSchema,
]);
export type CommandParserOutput = z.infer<typeof CommandParserOutputSchema>;


// --- Main Exported Function ---
export async function commandParser(input: CommandParserInput): Promise<CommandParserOutput> {
  // Obtiene datos dinámicos para darle contexto a la IA
  const { data: priceLists } = await getPriceLists();

  return commandParserFlow({
      ...input,
      priceLists: priceLists ?? [],
  });
}

// --- Genkit Flow Definition ---
const dynamicInputSchema = CommandParserInputSchema.extend({
    priceLists: z.array(z.any()),
});

const prompt = ai.definePrompt({
  name: 'commandParserPrompt',
  input: { schema: dynamicInputSchema },
  output: { schema: CommandParserOutputSchema },
  prompt: `
    Eres un asistente inteligente para "Mr. Blonde", una distribuidora de productos de belleza. Tu tarea es interpretar comandos en lenguaje natural de un administrador y convertirlos en objetos JSON estructurados para crear promociones, listas de precios o condiciones de venta.

    **Contexto disponible:**
    - Listas de Precios existentes: {{{json priceLists}}}

    **Instrucciones:**
    1.  **Identifica la Entidad:** Determina si el comando busca crear una 'promotion', 'pricelist' o 'sales_condition'.
    2.  **Extrae los Datos:** Analiza el texto para extraer los detalles y poblar el campo 'data' del esquema correspondiente.
    3.  **Genera un Nombre y Descripción:** Crea un nombre y descripción claros y concisos basados en el comando.
    4.  **Aplica Lógica de Negocio:**
        -   Para **listas de precios**, el usuario mencionará un descuento sobre una lista existente. Debes encontrar el 'base_price_list_id' correcto en el contexto de 'priceLists' que se te provee. El nombre de la lista en el comando puede no ser exacto, busca la coincidencia más cercana.
        -   Para **promociones y condiciones**, extrae los parámetros numéricos y de texto para las reglas.
    5.  **Responde ÚNICAMENTE con el objeto JSON** que se adhiere a uno de los esquemas de salida. No incluyas explicaciones.

    **Ejemplos:**

    Comando: "crear promo 10+2 en Ceras The Shaving Co"
    Respuesta JSON:
    \`\`\`json
    {
      "entity": "promotion",
      "data": {
        "name": "Promo Ceras 10+2",
        "description": "Llevando 10 Ceras The Shaving Co, se bonifican 2.",
        "rules": {
          "type": "buy_x_get_y_free",
          "buy": 10,
          "get": 2
        }
      }
    }
    \`\`\`

    Comando: "nueva lista para revendedores con 15% de descuento sobre la lista 'Precios Barbería Enero 2024'"
    Respuesta JSON:
    \`\`\`json
    {
        "entity": "pricelist",
        "data": {
            "name": "Lista Revendedores (15% OFF)",
            "base_price_list_id": "uuid-de-la-lista-base-encontrado-en-el-contexto",
            "discount_percentage": 15
        }
    }
    \`\`\`

    Comando: "nueva condicion de pago a 60 dias"
    Respuesta JSON:
    \`\`\`json
    {
        "entity": "sales_condition",
        "data": {
            "name": "Pago a 60 días",
            "description": "Plazo de pago extendido a 60 días netos desde la fecha de factura.",
            "rules": {
                "type": "net_days",
                "days": 60
            }
        }
    }
    \`\`\`

    **Comando a procesar:**
    {{{command}}}
  `,
});

const commandParserFlow = ai.defineFlow(
  {
    name: 'commandParserFlow',
    inputSchema: dynamicInputSchema,
    outputSchema: CommandParserOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("La IA no pudo interpretar el comando.");
    }
    return output;
  }
);
