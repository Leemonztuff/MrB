
'use server';

/**
 * @fileOverview Un agente de IA para analizar el comportamiento y el historial de un cliente.
 * 
 * - analyzeClientFlow: La función principal que realiza el análisis.
 * - ClientAnalysisInput: El tipo de entrada para el flujo.
 * - AnalyzeClientOutput: El tipo de salida del flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Client, OrderWithItems, AnalyzeClientOutput } from '@/types';

// Zod schema for input validation
const ClientAnalysisInputSchema = z.object({
  client: z.any().describe('El objeto completo del cliente, incluyendo su estado, tipo, etc.'),
  orders: z.array(z.any()).describe('Un array con el historial de pedidos del cliente, incluyendo los items de cada pedido.'),
});
export type ClientAnalysisInput = z.infer<typeof ClientAnalysisInputSchema>;

// Zod schema for structured output
const AnalyzeClientOutputSchema = z.object({
  summary: z.string().describe("Un resumen conciso (2-3 frases) del perfil y comportamiento general del cliente."),
  observations: z.array(z.string()).describe("Una lista de 3 a 5 observaciones clave y objetivas basadas en los datos, como frecuencia de compra, productos preferidos, ticket promedio, etc."),
  opportunities: z.array(z.string()).describe("Una lista de 2 a 3 oportunidades de venta o engagement accionables. Por ejemplo, sugerir productos complementarios, ofrecer una promoción específica o notar si no ha comprado un producto popular."),
  risks: z.array(z.string()).describe("Una lista de 1 a 2 riesgos potenciales a monitorear. Por ejemplo, si la frecuencia de compra ha disminuido, si solo compra productos en oferta, o si su última compra fue hace mucho tiempo."),
});

// Main exported function that wraps the Genkit flow
export async function analyzeClientFlow(input: ClientAnalysisInput): Promise<AnalyzeClientOutput> {
  return clientAnalysisFlow(input);
}

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'clientAnalysisPrompt',
  input: { schema: ClientAnalysisInputSchema },
  output: { schema: AnalyzeClientOutputSchema },
  prompt: `
    Eres un analista de negocios experto para "Mr. Blonde", una distribuidora de productos de belleza para barberías y profesionales.
    Tu tarea es analizar la información de un cliente específico y su historial de pedidos para proporcionar insights estratégicos al equipo de ventas.

    Analiza los siguientes datos:

    **Información del Cliente:**
    \`\`\`json
    {{{json client}}}
    \`\`\`

    **Historial de Pedidos:**
    \`\`\`json
    {{{json orders}}}
    \`\`\`

    Basado en estos datos, genera un análisis con el siguiente formato de salida. Sé conciso, profesional y directo.

    1.  **Summary:** Proporciona un resumen ejecutivo del cliente en 2 o 3 frases. Describe su perfil general (ej: "cliente leal y de alto valor", "comprador esporádico de productos específicos").
    2.  **Observations:** Enumera 3-5 puntos clave y objetivos derivados de los datos. Fíjate en:
        - Frecuencia de compra (¿es regular? ¿ha cambiado?).
        - Ticket promedio.
        - Productos o categorías de productos más comprados.
        - ¿Compra productos variados o siempre los mismos?
        - ¿Hace cuánto fue su último pedido?
    3.  **Opportunities:** Identifica 2-3 oportunidades claras y accionables. Piensa en:
        - Venta cruzada (cross-selling): Si compra cera, ¿le podría interesar un shampoo de la misma línea?
        - Venta incremental (up-selling): ¿Podría pasar a un formato más grande de un producto que compra a menudo?
        - Productos nuevos: ¿Hay lanzamientos recientes que encajen con su perfil de compra?
        - Reactivación: Si hace mucho que no compra, sugerir un contacto.
    4.  **Risks:** Señala 1 o 2 riesgos a tener en cuenta. Por ejemplo:
        - Disminución en la frecuencia o valor de los pedidos.
        - Concentración de compras en una sola categoría (riesgo si un competidor ofrece algo mejor en esa área).
        - Si el cliente solo compra cuando hay promociones.

    Tu respuesta DEBE ser únicamente el objeto JSON estructurado como se definió.
  `,
});


// Genkit Flow Definition
const clientAnalysisFlow = ai.defineFlow(
  {
    name: 'clientAnalysisFlow',
    inputSchema: ClientAnalysisInputSchema,
    outputSchema: AnalyzeClientOutputSchema,
  },
  async (input) => {
    // If no orders, return a specific analysis
    if (input.orders.length === 0) {
        return {
            summary: "Este es un cliente nuevo o inactivo que aún no ha realizado ningún pedido a través de la plataforma.",
            observations: ["No hay historial de pedidos para analizar.", "El cliente está activo en el sistema pero no ha generado transacciones."],
            opportunities: ["Realizar un contacto inicial para presentar el catálogo de productos.", "Ofrecer una promoción de bienvenida para incentivar la primera compra."],
            risks: ["El cliente podría estar inactivo o comprando a la competencia si ha pasado mucho tiempo desde su alta."],
        };
    }

    const { output } = await prompt(input);
    if (!output) {
      throw new Error("La IA no pudo generar un análisis.");
    }
    return output;
  }
);
