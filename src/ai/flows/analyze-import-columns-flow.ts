
"use server";

/**
 * @fileOverview Un flujo de IA para analizar columnas de archivos Excel/CSV y sugerir mapeos automáticos.
 * 
 * - analyzeImportColumnsFlow: Función principal para analizar columnas.
 * - AnalyzeImportColumnsInput: Tipo de entrada para el flujo.
 * - AnalyzeImportColumnsOutput: Tipo de salida del flujo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ColumnMappingSchema = z.object({
  sourceColumn: z.string().describe('El nombre original de la columna en el archivo.'),
  targetField: z.string().describe('El nombre del campo en el sistema destino (en español, snake_case).'),
  confidence: z.number().min(0).max(1).describe('Nivel de confianza del mapeo (0-1).'),
  description: z.string().describe('Breve descripción del campo destino.'),
});

const DataQualitySchema = z.object({
  totalRows: z.number().describe('Total de filas en el archivo.'),
  emptyRows: z.number().describe('Número de filas con campos vacíos.'),
  duplicateRows: z.number().describe('Número de filas duplicadas detectadas.'),
  sampleEmptyFields: z.number().describe('Número de campos vacíos en la muestra.'),
});

const AnalyzeImportColumnsInputSchema = z.object({
  headers: z.array(z.string()).describe('Los encabezados/nombres de columna del archivo.'),
  sampleRows: z.array(z.record(z.string())).describe('Las primeras 5-10 filas de datos para análisis.'),
  targetEntity: z.enum(['productos', 'clientes', 'listas_precios']).describe('El tipo de entidad que se intenta importar.'),
});
export type AnalyzeImportColumnsInput = z.infer<typeof AnalyzeImportColumnsInputSchema>;

const AnalyzeImportColumnsOutputSchema = z.object({
  detectedEntityType: z.enum(['productos', 'clientes', 'listas_precios']).describe('El tipo de entidad detectado.'),
  columnMappings: z.array(ColumnMappingSchema).describe('Lista de mapeos propuestos con confianza.'),
  suggestions: z.array(z.string()).describe('Sugerencias para el usuario sobre el archivo.'),
  dataQuality: DataQualitySchema.describe('Métricas de calidad de los datos.'),
  unmappedColumns: z.array(z.string()).describe('Columnas que no pudieron ser mapeadas automáticamente.'),
});
export type AnalyzeImportColumnsOutput = z.infer<typeof AnalyzeImportColumnsOutputSchema>;


const FIELD_MAPPINGS = {
  productos: {
    sku: ['sku', 'codigo', 'codigo sku', 'product id', 'id producto', 'article', 'articulo', 'ref', 'referencia'],
    name: ['nombre', 'name', 'producto', 'product name', 'descripcion', 'description', 'titulo', 'title'],
    description: ['descripcion', 'description', 'detalle', 'details'],
    category: ['categoria', 'category', 'tipo', 'type', 'linea', 'line'],
    price: ['precio', 'price', 'valor', 'value', 'precio unitario', 'unit price'],
    volume_price: ['precio mayor', 'volumen', 'volume price', 'bulk price', 'precio volumen'],
    stock: ['stock', 'inventario', 'inventory', 'cantidad', 'quantity', 'disponibles'],
    image_url: ['imagen', 'image', 'foto', 'photo', 'url imagen'],
  },
  clientes: {
    contact_name: ['nombre', 'name', 'contacto', 'contact', 'cliente', 'client', 'razon social', 'razón social'],
    email: ['email', 'correo', 'mail', 'e-mail', 'correo electronico'],
    phone: ['telefono', 'phone', 'tel', 'celular', 'mobile', 'cel', 'whatsapp'],
    address: ['direccion', 'address', 'domicilio', 'calle', 'street'],
    cuit: ['cuit', 'tax id', 'taxid', 'rif', 'dni', 'documento', 'document'],
    instagram: ['instagram', 'ig', 'red social'],
    delivery_window: ['horario', 'window', 'turno', 'delivery window'],
  },
  listas_precios: {
    sku: ['sku', 'codigo', 'codigo sku', 'product id', 'id producto', 'article'],
    name: ['nombre producto', 'producto', 'product name', 'articulo'],
    price: ['precio', 'price', 'valor'],
    volume_price: ['precio mayor', 'volumen', 'bulk'],
  },
};

function analyzeDataQuality(headers: string[], sampleRows: Record<string, any>[]) {
  const totalRows = sampleRows.length;
  let emptyRows = 0;
  let sampleEmptyFields = 0;
  const seenRows = new Set<string>();

  for (const row of sampleRows) {
    const values = Object.values(row).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) {
      emptyRows++;
    } else {
      sampleEmptyFields += Object.keys(row).length - values.length;
    }
    seenRows.add(JSON.stringify(row));
  }

  const duplicateRows = sampleRows.length - seenRows.size;

  return {
    totalRows,
    emptyRows,
    duplicateRows,
    sampleEmptyFields,
  };
}

function findBestMapping(sourceColumn: string, targetEntity: string): { field: string; description: string; confidence: number } | null {
  const normalizedSource = sourceColumn.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fieldMappings = FIELD_MAPPINGS[targetEntity as keyof typeof FIELD_MAPPINGS] || FIELD_MAPPINGS.productos;

  for (const [field, aliases] of Object.entries(fieldMappings)) {
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedSource === normalizedAlias || normalizedSource.includes(normalizedAlias) || normalizedAlias.includes(normalizedSource)) {
        return {
          field,
          description: getFieldDescription(field),
          confidence: 0.9,
        };
      }
    }
  }

  if (sourceColumn.toLowerCase().includes('precio') || sourceColumn.toLowerCase().includes('price')) {
    return { field: 'price', description: 'Precio del producto', confidence: 0.7 };
  }
  if (sourceColumn.toLowerCase().includes('nombre') || sourceColumn.toLowerCase().includes('name')) {
    return { field: 'name', description: 'Nombre del producto', confidence: 0.7 };
  }

  return null;
}

function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    sku: 'Código SKU del producto',
    name: 'Nombre del producto',
    description: 'Descripción del producto',
    category: 'Categoría del producto',
    price: 'Precio unitario',
    volume_price: 'Precio por volumen/mayor',
    stock: 'Cantidad en stock',
    image_url: 'URL de la imagen del producto',
    contact_name: 'Nombre del contacto o cliente',
    email: 'Correo electrónico',
    phone: 'Número de teléfono',
    address: 'Dirección',
    instagram: 'Usuario de Instagram',
    delivery_window: 'Ventana de entrega preferida',
    cuit: 'CUIT/DNI del cliente',
  };
  return descriptions[field] || field;
}

function generateSuggestions(headers: string[], sampleRows: Record<string, any>[], targetEntity: string): string[] {
  const suggestions: string[] = [];

  if (sampleRows.length < 5) {
    suggestions.push('El archivo tiene pocas filas. Asegúrate de que contenga todos los datos a importar.');
  }

  const hasEmptyCells = sampleRows.some(row => Object.values(row).some(v => v === null || v === undefined || v === ''));
  if (hasEmptyCells) {
    suggestions.push('Se detectaron celdas vacías en la muestra. Considera completar los campos requeridos.');
  }

  const uniqueValues = new Set<string>();
  let duplicateCount = 0;
  for (const row of sampleRows) {
    const rowStr = JSON.stringify(row);
    if (uniqueValues.has(rowStr)) {
      duplicateCount++;
    } else {
      uniqueValues.add(rowStr);
    }
  }
  if (duplicateCount > 0) {
    suggestions.push(`Se detectaron ${duplicateCount} filas duplicadas. Considera eliminarlas antes de importar.`);
  }

  if (targetEntity === 'productos') {
    const hasPrice = headers.some(h => h.toLowerCase().includes('precio') || h.toLowerCase().includes('price'));
    if (!hasPrice) {
      suggestions.push('No se detectó columna de precio. Los productos se importarán sin precio.');
    }
  }

  return suggestions;
}

export async function analyzeImportColumns(input: AnalyzeImportColumnsInput): Promise<AnalyzeImportColumnsOutput> {
  return analyzeImportColumnsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImportColumnsPrompt',
  input: { schema: AnalyzeImportColumnsInputSchema },
  output: { schema: AnalyzeImportColumnsOutputSchema },
  prompt: `
    Eres un asistente inteligente para "Mr. Blonde", una distribuidora de productos de belleza. 
    Tu tarea es analizar las columnas de un archivo Excel/CSV y sugerir mapeos automáticos a los campos del sistema.

    **Datos del archivo:**
    - Encabezados: {{{json headers}}}
    - Muestra de datos (primeras filas): {{{json sampleRows}}}
    - Entidad objetivo: {{{targetEntity}}}

    **Campos disponibles según entidad:**
    {{#if (eq targetEntity "productos")}}
    - sku: Código SKU del producto
    - name: Nombre del producto
    - description: Descripción del producto
    - category: Categoría (Cabello, Rostro, Merchandising)
    - price: Precio unitario
    - volume_price: Precio por volumen/mayorista
    - stock: Cantidad en inventario
    - image_url: URL de imagen del producto
    {{/if}}

    {{#if (eq targetEntity "clientes")}}
    - contact_name: Nombre del contacto o cliente
    - email: Correo electrónico
    - phone: Número de teléfono/WhatsApp
    - address: Dirección
    - instagram: Usuario de Instagram
    - delivery_window: Ventana horaria de entrega
    - cuit: CUIT/DNI
    {{/if}}

    {{#if (eq targetEntity "listas_precios")}}
    - sku: Código SKU del producto
    - name: Nombre del producto
    - price: Precio en esta lista
    - volume_price: Precio por volumen
    {{/if}}

    **Instrucciones:**
    1. Analiza cada encabezado y propón el mejor mapeo a un campo del sistema
    2. Asigna un nivel de confianza (0.0 a 1.0) basado en qué tan seguro estás del mapeo
    3. Identifica columnas que no pudieron ser mapeadas (unmappedColumns)
    4. Genera sugerencias útiles para el usuario
    5. Calcula métricas de calidad de datos

    **Reglas de mapeo:**
    - Busca coincidencias exactas o parciales en español e inglés
    - Considera sinónimos comunes (ej: "nombre" → "contact_name" para clientes)
    - Campos de precio deben contener números
    - Nombres deben ser texto

    Responde SOLO con el objeto JSON estructurado.
  `,
});

const analyzeImportColumnsFlow = ai.defineFlow(
  {
    name: 'analyzeImportColumnsFlow',
    inputSchema: AnalyzeImportColumnsInputSchema,
    outputSchema: AnalyzeImportColumnsOutputSchema,
  },
  async (input) => {
    const dataQuality = analyzeDataQuality(input.headers, input.sampleRows);
    
    const mappings: { sourceColumn: string; targetField: string; confidence: number; description: string }[] = [];
    const unmappedColumns: string[] = [];

    for (const header of input.headers) {
      const mapping = findBestMapping(header, input.targetEntity);
      if (mapping) {
        mappings.push({
          sourceColumn: header,
          targetField: mapping.field,
          confidence: mapping.confidence,
          description: mapping.description,
        });
      } else {
        unmappedColumns.push(header);
      }
    }

    const suggestions = generateSuggestions(input.headers, input.sampleRows, input.targetEntity);

    return {
      detectedEntityType: input.targetEntity,
      columnMappings: mappings,
      suggestions,
      dataQuality,
      unmappedColumns,
    };
  }
);
