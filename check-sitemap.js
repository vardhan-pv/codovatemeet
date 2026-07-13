const https = require('https');

https.get('https://meet.codovatesolutions.in/sitemap.xml', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('data:', data));
}).on('error', (e) => {
  console.error(e);
});
