require('dotenv').config();
const http = require('http');

const makeRequest = (options, body) => new Promise((resolve, reject) => {
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

const run = async () => {
  // Step 1: Login
  const loginBody = JSON.stringify({ email: 'suryawanshiviru07@gmail.com', password: 'Virendra@2004' });
  const loginRes = await makeRequest({
    hostname: 'localhost', port: 8000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);

  console.log('Login status:', loginRes.status);
  if (!loginRes.body.token) { console.error('Login failed:', JSON.stringify(loginRes.body)); return; }
  console.log('Logged in as:', loginRes.body.name, '| Role:', loginRes.body.role);
  const token = loginRes.body.token;

  // Step 2: NL Query
  const queryBody = JSON.stringify({ question: 'Show all high priority tasks' });
  const queryRes = await makeRequest({
    hostname: 'localhost', port: 8000, path: '/api/ai/ceo/nl-query', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(queryBody), 'Authorization': 'Bearer ' + token }
  }, queryBody);

  console.log('NL-Query status:', queryRes.status);
  if (queryRes.body.success) {
    console.log('SUCCESS! Results:', queryRes.body.resultCount, '| Time:', queryRes.body.executionTimeMs + 'ms');
  } else {
    console.error('FAILED:', queryRes.body.message);
  }
};

run().catch(console.error);
