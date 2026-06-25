"use server";

const PROVINCE_MAP: Record<string, string> = {
  "CIUDAD AUTONOMA BUENOS AIRES": "Ciudad Autónoma de Buenos Aires",
  "BUENOS AIRES": "Buenos Aires",
  "CATAMARCA": "Catamarca",
  "CHACO": "Chaco",
  "CHUBUT": "Chubut",
  "CORDOBA": "Córdoba",
  "CORRIENTES": "Corrientes",
  "ENTRE RIOS": "Entre Ríos",
  "FORMOSA": "Formosa",
  "JUJUY": "Jujuy",
  "LA PAMPA": "La Pampa",
  "LA RIOJA": "La Rioja",
  "MENDOZA": "Mendoza",
  "MISIONES": "Misiones",
  "NEUQUEN": "Neuquén",
  "RIO NEGRO": "Río Negro",
  "SALTA": "Salta",
  "SAN JUAN": "San Juan",
  "SAN LUIS": "San Luis",
  "SANTA CRUZ": "Santa Cruz",
  "SANTA FE": "Santa Fe",
  "SANTIAGO DEL ESTERO": "Santiago del Estero",
  "TIERRA DEL FUEGO": "Tierra del Fuego",
  "TUCUMAN": "Tucumán",
};

function parseStreetAddress(street: string): {
  street_address: string;
  street_number: string;
} {
  const match = street.match(/^(.+?)[\s,]+(\d[\d\s]*)(?:,|$)/);
  if (match) {
    return {
      street_address: match[1].trim(),
      street_number: match[2].trim(),
    };
  }
  return { street_address: street, street_number: "" };
}

export async function lookupCuit(cuit: string) {
  const clean = cuit.replace(/-/g, "");
  if (!/^\d{11}$/.test(clean)) {
    return { data: null, error: "CUIT debe tener 11 dígitos" };
  }

  try {
    const res = await fetch(`https://cuits.com.ar/api/v1/cuit/${clean}`, {
      next: { revalidate: 3600 },
    });

    if (res.status === 404) {
      return { data: null, error: "CUIT no encontrado" };
    }

    if (!res.ok) {
      return { data: null, error: "Error al consultar la API" };
    }

    const json = await res.json();

    const rawProvince = json.address?.province ?? "";
    const province = PROVINCE_MAP[rawProvince] ?? rawProvince;

    const rawLocality = json.address?.locality ?? "";
    const locality =
      rawLocality === "CAPITAL FEDERAL"
        ? "Ciudad Autónoma de Buenos Aires"
        : rawLocality;

    const streetRaw = json.address?.street ?? "";
    const { street_address, street_number } = parseStreetAddress(streetRaw);

    let fiscal_status = "";
    const ct = (json.company_type ?? "").toUpperCase();
    if (ct.includes("MONOTRIBUTISTA")) {
      fiscal_status = "Monotributista";
    } else if (ct.includes("SOCIEDAD") || ct.includes("S.A.") || ct.includes("S.R.L.") || ct.includes("RESPONSABLE")) {
      fiscal_status = "Responsable Inscripto";
    } else if (ct.includes("EXENTO")) {
      fiscal_status = "Exento";
    }

    return {
      data: {
        contact_name: json.name ?? "",
        fiscal_status,
        province,
        locality,
        street_address,
        street_number,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Error de conexión con la API" };
  }
}
