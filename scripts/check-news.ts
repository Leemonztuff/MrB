
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNews() {
    const { data, error } = await supabase.from('news').select('*');
    if (error) {
        console.error('Error fetching news:', error);
    } else {
        console.log('Current news items:', data);
        console.log('Active news items:', data.filter(n => n.is_active));
    }
}

checkNews();
