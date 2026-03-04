console.log("Loading environment variables...");
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCategories() {
    console.log("Migrating Cabello categories...");
    const { error: errCabello } = await supabase
        .from("products")
        .update({ category: "Cabello" })
        .in("category", ["Wax", "Powder", "Hairstyle", "Shampoo & Conditioners", "Cabello", "Ceras", "Shampoo"]);
    if (errCabello) console.error("Error migrating Cabello:", errCabello);

    console.log("Migrating Rostro categories...");
    const { error: errRostro } = await supabase
        .from("products")
        .update({ category: "Rostro" })
        .in("category", ["Shaving", "Facial & Beard", "Rostro", "Barba", "Afeitado"]);
    if (errRostro) console.error("Error migrating Rostro:", errRostro);

    console.log("Migrating Merchandising categories...");
    const { error: errMerch } = await supabase
        .from("products")
        .update({ category: "Merchandising" })
        .in("category", ["merchandising", "Merchandising"]);
    if (errMerch) console.error("Error migrating Merchandising:", errMerch);

    console.log("Migration complete.");
}

migrateCategories();
