const https = require('https');

// Vehicle number to test (you can change this)
const vehicleNumber = process.argv[2] || 'DL01AB1234';

// Use env variable if set, otherwise fallback to the provided key
const RAPIDAPI_KEY = process.env.VITE_RAPIDAPI_KEY || '5ee5ed2c5amsh256b99057ea4d2bp1db86ajsndcfaffe8cb85';
const HOST = 'vehicle-rc-information-v2.p.rapidapi.com';
const PATH = '/';

const postData = JSON.stringify({ vehicle_number: vehicleNumber });

const options = {
  hostname: HOST,
  port: 443,
  path: PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-rapidapi-host': HOST,
    'x-rapidapi-key': RAPIDAPI_KEY,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nRaw body:');
    console.log(data);
    try {
      const json = JSON.parse(data);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (err) {
      console.error('\nFailed to parse JSON:', err.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
