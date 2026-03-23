export type ImportEntity = 'productos' | 'clientes' | 'listas_precios';

export type ColumnMapping = {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  description: string;
};

export type DataQuality = {
  totalRows: number;
  emptyRows: number;
  duplicateRows: number;
  sampleEmptyFields: number;
};

export type ImportAnalysisResult = {
  detectedEntityType: ImportEntity;
  columnMappings: ColumnMapping[];
  suggestions: string[];
  dataQuality: DataQuality;
  unmappedColumns: string[];
};

export type FileData = {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
};

export type ImportProgress = {
  current: number;
  total: number;
  currentItem?: string;
};

export type ImportError = {
  row: number;
  field: string;
  message: string;
};

export type ImportResult = {
  success: boolean;
  imported: number;
  errors: ImportError[];
  skipped: number;
};

export type FieldDefinition = {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  description?: string;
};

export const PRODUCT_FIELDS: FieldDefinition[] = [
  { key: 'sku', label: 'SKU', type: 'string', description: 'Código único del producto' },
  { key: 'name', label: 'Nombre', type: 'string', required: true, description: 'Nombre del producto' },
  { key: 'description', label: 'Descripción', type: 'string', description: 'Descripción detallada' },
  { key: 'category', label: 'Categoría', type: 'string', description: 'Categoría: Cabello, Rostro, Merchandising' },
  { key: 'price', label: 'Precio', type: 'number', description: 'Precio unitario' },
  { key: 'volume_price', label: 'Precio Volumen', type: 'number', description: 'Precio por mayor' },
  { key: 'stock', label: 'Stock', type: 'number', description: 'Cantidad en inventario' },
  { key: 'image_url', label: 'URL Imagen', type: 'string', description: 'URL de la imagen del producto' },
];

export const CLIENT_FIELDS: FieldDefinition[] = [
  { key: 'contact_name', label: 'Nombre', type: 'string', required: true, description: 'Nombre del contacto' },
  { key: 'email', label: 'Email', type: 'string', description: 'Correo electrónico' },
  { key: 'phone', label: 'Teléfono', type: 'string', description: 'Teléfono/WhatsApp' },
  { key: 'address', label: 'Dirección', type: 'string', description: 'Dirección de entrega' },
  { key: 'cuit', label: 'CUIT/DNI', type: 'string', description: 'Documento fiscal' },
  { key: 'instagram', label: 'Instagram', type: 'string', description: 'Usuario de Instagram' },
  { key: 'delivery_window', label: 'Horario Entrega', type: 'string', description: 'Ventana horaria preferida' },
];

export const PRICE_LIST_FIELDS: FieldDefinition[] = [
  { key: 'sku', label: 'SKU', type: 'string', required: true, description: 'Código del producto' },
  { key: 'name', label: 'Nombre Producto', type: 'string', description: 'Nombre del producto' },
  { key: 'price', label: 'Precio', type: 'number', required: true, description: 'Precio en esta lista' },
  { key: 'volume_price', label: 'Precio Volumen', type: 'number', description: 'Precio por mayor' },
];
