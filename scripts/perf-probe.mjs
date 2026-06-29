const endpoints = [
  { name: 'api-health', url: 'https://wilms-production.up.railway.app/health' },
  { name: 'bff-health', url: 'https://wilms.vercel.app/api/wilms/health' },
];

for (const { name, url } of endpoints) {
  const times = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    await fetch(url);
    times.push(Math.round(performance.now() - start));
  }
  const warm = times.slice(1);
  const meanWarm = warm.reduce((a, b) => a + b, 0) / warm.length;
  console.log(`=== ${name} ===`);
  console.log(`samples_ms: ${times.join(', ')}`);
  console.log(`cold_ms: ${times[0]}`);
  console.log(`min_ms: ${Math.min(...times)}`);
  console.log(`max_ms: ${Math.max(...times)}`);
  console.log(`mean_warm_ms: ${meanWarm.toFixed(1)}`);
}
