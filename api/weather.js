const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const OPENMETEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const OPENMETEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';

function json(res, body, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return res.end(JSON.stringify(body));
}

function iconFromOpenWeather(code, main) {
  if (!code) {
    const value = String(main || '').toLowerCase();
    if (value.includes('rain') || value.includes('thunder')) return 'rain';
    if (value.includes('cloud')) return 'cloud';
    return 'sun';
  }
  switch (String(code).slice(0, 2)) {
    case '01': return 'sun';
    case '02':
    case '03': return 'partly';
    case '04': return 'cloud';
    case '09':
    case '10':
    case '11': return 'rain';
    case '13':
    case '50': return 'cloud';
    default: return 'sun';
  }
}

function iconFromWmo(code) {
  const n = Number(code);
  if (n === 0 || n === 1) return 'sun';
  if ([2, 3].includes(n)) return 'partly';
  if ([45, 48].includes(n)) return 'cloud';
  if ((n >= 51 && n <= 67) || (n >= 80 && n <= 82) || (n >= 95 && n <= 99)) return 'rain';
  return 'cloud';
}

function conditionFromWmo(code) {
  const n = Number(code);
  const labels = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'slight snow',
    73: 'moderate snow',
    75: 'heavy snow',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    95: 'thunderstorm',
    96: 'thunderstorm with hail',
    99: 'thunderstorm with heavy hail',
  };
  return labels[n] || 'weather conditions';
}

function direction(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round((Number(deg) || 0) / 22.5) % 16];
}

function timeFromUnix(timestamp) {
  if (!timestamp) return undefined;
  return new Date(Number(timestamp) * 1000).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function readJson(url) {
  const response = await fetch(url);
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(body?.message || `Upstream request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function geocodeOpenMeteo(query) {
  const url = `${OPENMETEO_GEOCODING}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const data = await readJson(url);
  const result = data?.results?.[0];
  if (!result) throw new Error('Location not found. Try a different city name.');
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: result.name,
    country: result.country_code || result.country || '',
  };
}

async function fetchOpenMeteo(query) {
  let place;
  if (typeof query === 'string') {
    place = await geocodeOpenMeteo(query);
  } else {
    place = { lat: query.lat, lon: query.lon, name: 'Your location', country: '' };
  }

  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    timezone: 'auto',
    forecast_days: '7',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'pressure_msl',
      'visibility',
    ].join(','),
    hourly: 'precipitation_probability',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'relative_humidity_2m_mean',
      'wind_speed_10m_mean',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),
  });

  const data = await readJson(`${OPENMETEO_FORECAST}?${params.toString()}`);
  const c = data.current || {};
  const d = data.daily || {};

  const locationName = [place.name, place.country].filter(Boolean).join(', ') || `${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}`;

  return {
    location: locationName,
    source: 'open-meteo',
    today: {
      temp: Math.round(c.temperature_2m ?? 0),
      feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
      humidity: Math.round(c.relative_humidity_2m ?? 0),
      wind: Math.round(c.wind_speed_10m ?? 0),
      rainfall: Number(c.precipitation ?? 0),
      condition: conditionFromWmo(c.weather_code),
      icon: iconFromWmo(c.weather_code),
      rainProbability: Number(data.hourly?.precipitation_probability?.[0] ?? d.precipitation_probability_max?.[0] ?? 0),
      pressure: Math.round(c.pressure_msl ?? 0),
      visibility: Math.round((c.visibility ?? 0) / 1000),
      windDirection: direction(c.wind_direction_10m),
      sunrise: d.sunrise?.[0] ? new Date(d.sunrise[0]).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : undefined,
      sunset: d.sunset?.[0] ? new Date(d.sunset[0]).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    },
    forecast: (d.time || []).map((date, i) => ({
      day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      tempHi: Math.round(d.temperature_2m_max?.[i] ?? 0),
      tempLo: Math.round(d.temperature_2m_min?.[i] ?? 0),
      condition: conditionFromWmo(d.weather_code?.[i]),
      icon: iconFromWmo(d.weather_code?.[i]),
      humidity: Math.round(d.relative_humidity_2m_mean?.[i] ?? 0),
      wind: Math.round(d.wind_speed_10m_mean?.[i] ?? 0),
      rainProbability: Math.round(d.precipitation_probability_max?.[i] ?? 0),
    })),
  };
}

async function fetchOpenWeather(query, apiKey) {
  const base = `${OPENWEATHER_BASE}/weather?units=metric&appid=${encodeURIComponent(apiKey)}`;
  const url = typeof query === 'string'
    ? `${base}&q=${encodeURIComponent(query)}`
    : `${base}&lat=${encodeURIComponent(query.lat)}&lon=${encodeURIComponent(query.lon)}`;

  const current = await readJson(url);
  const forecastUrl = `${OPENWEATHER_BASE}/forecast?lat=${current.coord.lat}&lon=${current.coord.lon}&units=metric&appid=${encodeURIComponent(apiKey)}`;
  const forecast = await readJson(forecastUrl);
  const entries = Array.isArray(forecast.list) ? forecast.list : [];

  const groups = new Map();
  for (const item of entries) {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
    const group = groups.get(day) || [];
    group.push(item);
    groups.set(day, group);
  }

  const days = Array.from(groups.values()).slice(0, 5);
  const first = entries[0];

  return {
    location: `${current.name}${current.sys?.country ? `, ${current.sys.country}` : ''}`,
    source: 'openweather',
    today: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      wind: Math.round((current.wind?.speed || 0) * 3.6),
      rainfall: current.rain?.['1h'] || 0,
      condition: current.weather?.[0]?.description || 'Clear',
      icon: iconFromOpenWeather(current.weather?.[0]?.icon, current.weather?.[0]?.main),
      rainProbability: Math.round((first?.pop || 0) * 100),
      pressure: current.main.pressure,
      visibility: current.visibility,
      windDirection: direction(current.wind?.deg),
      sunrise: timeFromUnix(current.sys?.sunrise),
      sunset: timeFromUnix(current.sys?.sunset) || '',
    },
    forecast: days.map((items) => {
      const representative = items.reduce((best, item) => {
        const bestHour = Math.abs(new Date(best.dt * 1000).getUTCHours() - 12);
        const itemHour = Math.abs(new Date(item.dt * 1000).getUTCHours() - 12);
        return itemHour < bestHour ? item : best;
      }, items[0]);

      return {
        day: new Date(representative.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        tempHi: Math.round(Math.max(...items.map((item) => item.main.temp))),
        tempLo: Math.round(Math.min(...items.map((item) => item.main.temp))),
        condition: representative.weather?.[0]?.description || 'Clear',
        icon: iconFromOpenWeather(representative.weather?.[0]?.icon, representative.weather?.[0]?.main),
        humidity: Math.round(items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length),
        wind: Math.round((items.reduce((sum, item) => sum + (item.wind?.speed || 0), 0) / items.length) * 3.6),
        rainProbability: Math.round(Math.max(...items.map((item) => item.pop || 0)) * 100),
      };
    }),
  };
}


function parseQuery(req) {
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  if (q && q.length > 120) {
    const error = new Error('Location query is too long.');
    error.status = 400;
    throw error;
  }

  const latRaw = req.query?.lat;
  const lonRaw = req.query?.lon;
  const hasCoords = latRaw !== undefined || lonRaw !== undefined;

  if (hasCoords) {
    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const error = new Error('Latitude and longitude must be valid numbers.');
      error.status = 400;
      throw error;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      const error = new Error('Latitude or longitude is outside the valid range.');
      error.status = 400;
      throw error;
    }

    return { lat, lon };
  }

  return q || 'Thanjavur,Tamil Nadu,IN';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, { error: 'Method not allowed.' }, 405);
  }

  let query;
  try {
    query = parseQuery(req);
  } catch (error) {
    return json(res, { error: error?.message || 'Invalid weather request.' }, error?.status || 400);
  }

  const apiKey = String(process.env.OPENWEATHER_API_KEY || '').trim();

  // Prefer OpenWeather when configured. If the key is missing or rejected,
  // use Open-Meteo as a real-data provider rather than showing fake data.
  if (apiKey) {
    try {
      return json(res, await fetchOpenWeather(query, apiKey));
    } catch (error) {
      if (![401, 403].includes(error?.status)) {
        return json(res, { error: error?.message || 'Weather provider failed.' }, error?.status || 502);
      }
    }
  }

  try {
    return json(res, await fetchOpenMeteo(query));
  } catch (error) {
    return json(res, {
      error: error?.message || 'No live weather provider is currently available.',
    }, error?.status || 502);
  }
}
