const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/news?select=*';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

fetch(url, {
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
    }
}).then(r => r.json()).then(console.log).catch(console.error);

fetch(url + '&is_active=eq.true', {
    headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
}).then(r => r.json()).then(d => console.log('Anon fetch:', d)).catch(console.error);
