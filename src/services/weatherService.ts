import type { WeatherData } from '@/services/types';

export type { WeatherData } from '@/services/types';

const CACHE_TTL = 10 * 60 * 1000;

type LocationQuery = string | { lat: number; lon: number };

interface WeatherCacheEntry {
  timestamp: number;
  data: WeatherData;
}

const weatherCache = new Map<string, WeatherCacheEntry>();

function cacheKey(query: LocationQuery) {
  return typeof query === 'string'
    ? `q:${query.toLowerCase()}`
    : `coords:${query.lat.toFixed(5)},${query.lon.toFixed(5)}`;
}

async function requestProductionWeather(query: LocationQuery): Promise<WeatherData> {
  const params = new URLSearchParams();

  if (typeof query === 'string') {
    params.set('q', query);
  } else {
    params.set('lat', String(query.lat));
    params.set('lon', String(query.lon));
  }

  const response = await fetch(`/api/weather?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : `Weather request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { location?: unknown }).location !== 'string' ||
    typeof (body as { source?: unknown }).source !== 'string' ||
    typeof (body as { today?: unknown }).today !== 'object' ||
    !Array.isArray((body as { forecast?: unknown }).forecast)
  ) {
    throw new Error('Weather service returned an invalid live-data response.');
  }

  return body as WeatherData;
}

async function requestLocalWeather(query: LocationQuery): Promise<WeatherData> {
  if (!import.meta.env.DEV) {
    throw new Error('Live weather service is unavailable.');
  }

  const apiKey = String(import.meta.env.VITE_OPENWEATHER_API_KEY ?? '').trim();

  if (!apiKey) {
    throw new Error(
      'Local weather is not configured. Add VITE_OPENWEATHER_API_KEY to .env.local, or run the project with Vercel Functions using `vercel dev`.',
    );
  }

  const base = 'https://api.openweathermap.org/data/2.5';
  const currentUrl =
    typeof query === 'string'
      ? `${base}/weather?units=metric&appid=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`
      : `${base}/weather?units=metric&appid=${encodeURIComponent(apiKey)}&lat=${query.lat}&lon=${query.lon}`;

  const currentResponse = await fetch(currentUrl);

  if (!currentResponse.ok) {
    if (currentResponse.status === 401 || currentResponse.status === 403) {
      throw new Error('Local OpenWeather API key is invalid or not activated yet.');
    }
    if (currentResponse.status === 404) {
      throw new Error('Location not found. Try a different city name.');
    }
    throw new Error(`Weather request failed with status ${currentResponse.status}.`);
  }

  const current = await currentResponse.json();
  const forecastResponse = await fetch(
    `${base}/forecast?lat=${current.coord.lat}&lon=${current.coord.lon}&units=metric&appid=${encodeURIComponent(apiKey)}`,
  );

  if (!forecastResponse.ok) {
    throw new Error(`Weather forecast request failed with status ${forecastResponse.status}.`);
  }

  const forecast = await forecastResponse.json();
  const entries = Array.isArray(forecast.list) ? forecast.list : [];
  const groups = new Map<string, typeof entries>();

  for (const item of entries) {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
    const group = groups.get(day) ?? [];
    group.push(item);
    groups.set(day, group);
  }

  const days = Array.from(groups.values()).slice(0, 5);
  const first = entries[0];

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const direction = directions[Math.round((current.wind?.deg ?? 0) / 22.5) % 16];

  const mapIcon = (iconCode?: string, main?: string) => {
    const prefix = iconCode?.slice(0, 2);
    if (prefix === '01') return 'sun';
    if (prefix === '02' || prefix === '03') return 'partly';
    if (prefix === '04' || prefix === '13' || prefix === '50') return 'cloud';
    if (prefix === '09' || prefix === '10' || prefix === '11') return 'rain';

    const normalized = (main ?? '').toLowerCase();
    if (normalized.includes('rain') || normalized.includes('thunder')) return 'rain';
    if (normalized.includes('cloud')) return 'cloud';
    return 'sun';
  };

  return {
    location: `${current.name}${current.sys?.country ? `, ${current.sys.country}` : ''}`,
    source: 'openweather',
    today: {
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      wind: Math.round((current.wind?.speed ?? 0) * 3.6),
      rainfall: current.rain?.['1h'] ?? 0,
      condition: current.weather?.[0]?.description ?? 'Clear',
      icon: mapIcon(current.weather?.[0]?.icon, current.weather?.[0]?.main),
      rainProbability: Math.round((first?.pop ?? 0) * 100),
      pressure: current.main.pressure,
      visibility: current.visibility,
      windDirection: direction,
      sunrise: current.sys?.sunrise
        ? new Date(current.sys.sunrise * 1000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
        : undefined,
      sunset: current.sys?.sunset
        ? new Date(current.sys.sunset * 1000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
        : '',
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
        condition: representative.weather?.[0]?.description ?? 'Clear',
        icon: mapIcon(representative.weather?.[0]?.icon, representative.weather?.[0]?.main),
        humidity: Math.round(items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length),
        wind: Math.round((items.reduce((sum, item) => sum + (item.wind?.speed ?? 0), 0) / items.length) * 3.6),
        rainProbability: Math.round(Math.max(...items.map((item) => item.pop ?? 0)) * 100),
      };
    }),
  };
}

export async function fetchWeather(location: LocationQuery): Promise<WeatherData> {
  const key = cacheKey(location);
  const cached = weatherCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let weather: WeatherData;

  try {
    weather = await requestProductionWeather(location);
  } catch (productionError) {
    // `npm run dev` does not serve Vercel Functions. Use the local OpenWeather
    // key only during development so local testing remains functional.
    if (import.meta.env.DEV) {
      weather = await requestLocalWeather(location);
    } else {
      throw productionError;
    }
  }

  weatherCache.set(key, { timestamp: Date.now(), data: weather });
  return weather;
}
