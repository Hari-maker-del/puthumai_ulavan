import type { WeatherData } from '@/services/types';

export type { WeatherData } from '@/services/types';

// Live weather without a browser API key. Open-Meteo provides forecast data
// from multiple national weather services and geocoding for place names.
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const CACHE_TTL = 10 * 60 * 1000;

type LocationQuery = string | { lat: number; lon: number; label?: string };
interface WeatherCacheEntry { timestamp: number; data: WeatherData }
interface GeocodeResult { latitude: number; longitude: number; name: string; country?: string; admin1?: string }
const weatherCache = new Map<string, WeatherCacheEntry>();

function cacheKey(query: LocationQuery) {
  return typeof query === 'string' ? `q:${query.toLowerCase()}` : `coords:${query.lat.toFixed(5)},${query.lon.toFixed(5)}`;
}

function description(code: number | undefined): { condition: string; icon: 'sun'|'cloud'|'rain'|'partly' } {
  if (code === 0) return { condition: 'Clear sky', icon: 'sun' };
  if (code === 1) return { condition: 'Mainly clear', icon: 'sun' };
  if (code === 2) return { condition: 'Partly cloudy', icon: 'partly' };
  if (code === 3 || code === 45 || code === 48) return { condition: 'Cloudy', icon: 'cloud' };
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code ?? -1)) return { condition: code && code >= 95 ? 'Thunderstorm' : 'Rain', icon: 'rain' };
  if ([71,73,75,77,85,86].includes(code ?? -1)) return { condition: 'Snow', icon: 'cloud' };
  return { condition: 'Cloudy', icon: 'cloud' };
}

function windDirection(deg: number | undefined) {
  if (deg === undefined || Number.isNaN(deg)) return '—';
  const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return directions[Math.round(deg / 22.5) % 16];
}

async function json<T>(url: string): Promise<T> {
  let response: Response;
  try { response = await fetch(url); }
  catch { throw new Error('Unable to connect to the live weather service. Check your internet connection and try again.'); }
  if (!response.ok) throw new Error(`Live weather request failed with status ${response.status}.`);
  return response.json() as Promise<T>;
}

async function resolveLocation(query: LocationQuery) {
  if (typeof query !== 'string') return { lat: query.lat, lon: query.lon, label: query.label ?? 'Your location' };
  const data = await json<{ results?: GeocodeResult[] }>(`${GEOCODING_BASE}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  const result = data.results?.[0];
  if (!result) throw new Error(`Location not found for "${query}".`);
  return { lat: result.latitude, lon: result.longitude, label: [result.name, result.admin1, result.country].filter(Boolean).join(', ') };
}

export async function fetchWeather(location: LocationQuery): Promise<WeatherData> {
  const key = cacheKey(location);
  const cached = weatherCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  const resolved = await resolveLocation(location);
  const params = new URLSearchParams({
    latitude: String(resolved.lat), longitude: String(resolved.lon), timezone: 'auto', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset',
    wind_speed_unit: 'kmh', temperature_unit: 'celsius', precipitation_unit: 'mm',
  });
  const data = await json<Record<string, Record<string, unknown[]>>>(`${FORECAST_BASE}?${params}`);
  if (!data.current || !data.daily) throw new Error('Live weather data is unavailable for this location.');

  const forecast = (data.daily.time ?? []).map((date: string, i: number) => {
    const d = description(data.daily.weather_code?.[i]);
    return {
      day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      tempHi: Math.round(data.daily.temperature_2m_max?.[i] ?? 0),
      tempLo: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
      condition: d.condition, icon: d.icon,
      rainProbability: Math.round(data.daily.precipitation_probability_max?.[i] ?? 0),
    };
  });

  const current = description(data.current.weather_code);
  const result: WeatherData = {
    location: resolved.label,
    source: 'open-meteo',
    today: {
      temp: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      wind: Math.round(data.current.wind_speed_10m),
      rainfall: Number(data.current.precipitation ?? 0),
      condition: current.condition, icon: current.icon,
      rainProbability: Math.round(data.daily.precipitation_probability_max?.[0] ?? 0),
      pressure: Math.round(data.current.surface_pressure ?? 0),
      visibility: Math.round((data.current.visibility ?? 0) / 1000),
      windDirection: windDirection(data.current.wind_direction_10m),
      sunrise: data.daily.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : undefined,
      sunset: data.daily.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    },
    forecast,
  };
  weatherCache.set(key, { timestamp: Date.now(), data: result });
  return result;
}
