import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
    const { data, error } = await supabase.from('news').select('*');
    console.log("All news", data);

    const now = new Date().toISOString();
    console.log("Current ISO", now);

    const { data: pub, error: pubErr } = await supabase
        .from('news')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: false });

    console.log("Public query:", pub?.length, pub);
}

test();
