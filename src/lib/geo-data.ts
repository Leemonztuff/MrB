export const provinces = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

// This is a partial list for demonstration purposes.
// A real application might fetch this from an API or a more complete static file.
const localities: Record<string, string[]> = {
  "Buenos Aires": ["La Plata", "Mar del Plata", "Quilmes", "Bahía Blanca", "Tigre", "San Isidro"],
  "Catamarca": ["San Fernando del Valle de Catamarca", "Andalgalá", "Belén"],
  "Chaco": ["Resistencia", "Barranqueras", "Presidencia Roque Sáenz Peña"],
  "Chubut": ["Rawson", "Comodoro Rivadavia", "Puerto Madryn", "Trelew"],
  "Ciudad Autónoma de Buenos Aires": ["Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"],
  "Córdoba": ["Córdoba", "Río Cuarto", "Villa Carlos Paz", "Villa María"],
  "Corrientes": ["Corrientes", "Goya", "Paso de los Libres"],
  "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú"],
  "Formosa": ["Formosa", "Clorinda"],
  "Jujuy": ["San Salvador de Jujuy", "La Quiaca", "Humahuaca"],
  "La Pampa": ["Santa Rosa", "General Pico"],
  "La Rioja": ["La Rioja", "Chilecito"],
  "Mendoza": ["Mendoza", "San Rafael", "Godoy Cruz"],
  "Misiones": ["Posadas", "Puerto Iguazú", "Oberá"],
  "Neuquén": ["Neuquén", "San Martín de los Andes", "Villa La Angostura"],
  "Río Negro": ["Viedma", "San Carlos de Bariloche", "General Roca"],
  "Salta": ["Salta", "Cafayate", "Tartagal"],
  "San Juan": ["San Juan", "Rivadavia", "Chimbas"],
  "San Luis": ["San Luis", "Villa Mercedes", "Merlo"],
  "Santa Cruz": ["Río Gallegos", "Caleta Olivia", "El Calafate"],
  "Santa Fe": ["Santa Fe", "Rosario", "Venado Tuerto"],
  "Santiago del Estero": ["Santiago del Estero", "La Banda", "Termas de Río Hondo"],
  "Tierra del Fuego": ["Ushuaia", "Río Grande"],
  "Tucumán": ["San Miguel de Tucumán", "Yerba Buena", "Tafí Viejo"],
};

export const getLocalitiesByProvince = (province: string): string[] => {
  return localities[province] || [];
};
