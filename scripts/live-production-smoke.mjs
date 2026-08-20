const base = String(process.env.PRODUCTION_URL || '').trim().replace(/\/+$/, '');

if (!base) {
  console.error('LIVE PRODUCTION SMOKE: BLOCKED');
  console.error('Set PRODUCTION_URL, for example: $env:PRODUCTION_URL="https://puthumai-ulavan.vercel.app"');
  process.exit(2);
}

async function check(pathname, expectedContentType) {
  const response = await fetch(`${base}${pathname}`, {
    headers: { Accept: expectedContentType },
    redirect: 'follow',
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error(`${pathname}: HTTP ${response.status}`);
  }

  if (!contentType.includes(expectedContentType.split(';')[0])) {
    throw new Error(`${pathname}: unexpected content-type ${contentType}`);
  }

  return response;
}

try {
  await check('/', 'text/html');
  const weather = await check('/api/weather?q=Thanjavur%2CTamil%20Nadu%2CIN', 'application/json');
  const payload = await weather.json();

  if (
    typeof payload?.location !== 'string' ||
    typeof payload?.source !== 'string' ||
    typeof payload?.today !== 'object' ||
    !Array.isArray(payload?.forecast)
  ) {
    throw new Error('Weather endpoint returned an invalid live-data payload.');
  }

  const allowedSources = new Set(['openweather', 'open-meteo']);
  if (!allowedSources.has(payload.source)) {
    throw new Error(`Unexpected weather source: ${payload.source}`);
  }

  console.log('LIVE PRODUCTION SMOKE: PASS');
  console.log(`- App: ${base}/`);
  console.log(`- Weather: ${payload.source}`);
  console.log(`- Location: ${payload.location}`);
} catch (error) {
  console.error('LIVE PRODUCTION SMOKE: FAIL');
  console.error(`- ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
