require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const https = require('https');
const host = process.env.SUPABASE_URL.replace('https://', '').replace(/\/$/, '');
const anon = process.env.SUPABASE_KEY;

function request(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: host, path, method: 'GET',
      headers: { 'Accept': 'application/json', 'apikey': anon, 'Authorization': 'Bearer ' + anon }
    };
    const req = https.request(opts, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => resolve({ status: r.statusCode, data: d })); });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Try OpenAPI spec
  let r = await request('/rest/v1/');
  if (r.status === 200) {
    let t = r.data.substring(0, 10000);
    // Find pagos section
    let idx = t.indexOf('"pagos"');
    if (idx >= 0) console.log('Found pagos:', t.substring(idx, idx + 800));
    else console.log('Tables found:', t.match(/"\w+"/g)?.filter(x => x !== '""').join(', '));
  } else {
    console.log('Status:', r.status, r.data.substring(0, 500));
  }
}
main().catch(console.error);
