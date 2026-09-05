import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, MapPin, Thermometer, Wind, Droplets, CloudRain } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

type WeatherPoint = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  temperature: number;
  humidity: number;
  wind: number;
  precipitation: number;
  code: number;
};

type Feature = { geometry?: { type?: string; coordinates?: unknown } };
const WORLD_GEOJSON = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
const REFRESH_MS = 10 * 60 * 1000;
const cities = [
  ['Vancouver', 'CA', 49.2827, -123.1207], ['New York', 'US', 40.7128, -74.006], ['Mexico City', 'MX', 19.4326, -99.1332], ['Lima', 'PE', -12.0464, -77.0428], ['Buenos Aires', 'AR', -34.6037, -58.3816], ['Santiago', 'CL', -33.4489, -70.6693],
  ['London', 'GB', 51.5074, -0.1278], ['Paris', 'FR', 48.8566, 2.3522], ['Madrid', 'ES', 40.4168, -3.7038], ['Cairo', 'EG', 30.0444, 31.2357], ['Lagos', 'NG', 6.5244, 3.3792], ['Nairobi', 'KE', -1.2921, 36.8219], ['Cape Town', 'ZA', -33.9249, 18.4241], ['Johannesburg', 'ZA', -26.2041, 28.0473],
  ['São Paulo', 'BR', -23.5505, -46.6333], ['Mumbai', 'IN', 19.076, 72.8777], ['Delhi', 'IN', 28.6139, 77.209], ['Kolkata', 'IN', 22.5726, 88.3639], ['Chennai', 'IN', 13.0827, 80.2707], ['Bengaluru', 'IN', 12.9716, 77.5946], ['Singapore', 'SG', 1.3521, 103.8198], ['Bangkok', 'TH', 13.7563, 100.5018], ['Jakarta', 'ID', -6.2088, 106.8456],
  ['Tokyo', 'JP', 35.6762, 139.6503], ['Seoul', 'KR', 37.5665, 126.978], ['Beijing', 'CN', 39.9042, 116.4074], ['Shanghai', 'CN', 31.2304, 121.4737], ['Manila', 'PH', 14.5995, 120.9842], ['Hong Kong', 'HK', 22.3193, 114.1694],
  ['Sydney', 'AU', -33.8688, 151.2093], ['Melbourne', 'AU', -37.8136, 144.9631], ['Auckland', 'NZ', -36.8509, 174.7645], ['Perth', 'AU', -31.9505, 115.8605], ['Moscow', 'RU', 55.7558, 37.6173], ['Istanbul', 'TR', 41.0082, 28.9784], ['Dubai', 'AE', 25.2048, 55.2708], ['Riyadh', 'SA', 24.7136, 46.6753],
] as const;

function project(lon: number, lat: number, width = 1000, height = 500) {
  return [(lon + 180) / 360 * width, (90 - lat) / 180 * height] as const;
}
function pathForGeometry(geometry: Feature['geometry']) {
  if (!geometry?.coordinates) return '';
  const makeRing = (ring: unknown[]) => ring.map((point) => {
    const [lon, lat] = point as [number, number]; const [x, y] = project(lon, lat); return `${x},${y}`;
  }).join(' ');
  const c = geometry.coordinates as unknown;
  if (geometry.type === 'Polygon') return (c as unknown[]).map(r => `M ${makeRing(r as unknown[])}`).join(' ');
  if (geometry.type === 'MultiPolygon') return (c as unknown[]).flatMap(p => (p as unknown[]).map(r => `M ${makeRing(r as unknown[])}`)).join(' ');
  return '';
}
function weatherLabel(code: number) {
  if (code === 0) return 'Clear'; if (code <= 3) return 'Cloudy'; if (code >= 95) return 'Storm'; if (code >= 51) return 'Rain'; return 'Snow';
}

export default function WorldWeatherMap() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [points, setPoints] = useState<WeatherPoint[]>([]);
  const [selected, setSelected] = useState<WeatherPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: 1000, h: 500 });
  const drag = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [geoResponse, weatherResponse] = await Promise.all([
        fetch(WORLD_GEOJSON),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cities.map(c => c[2]).join(',')}&longitude=${cities.map(c => c[3]).join(',')}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`),
      ]);
      if (!geoResponse.ok || !weatherResponse.ok) throw new Error('World weather service is temporarily unavailable.');
      const geo = await geoResponse.json() as { features?: Feature[] };
      const raw = await weatherResponse.json() as Array<{ current?: Record<string, number> }> | { current?: Record<string, number> };
      const rows = Array.isArray(raw) ? raw : [raw];
      setFeatures(geo.features ?? []);
      setPoints(cities.map((city, i) => {
        const current = rows[i]?.current ?? {};
        return { name: city[0], country: city[1], lat: city[2], lon: city[3], temperature: Math.round(current.temperature_2m ?? 0), humidity: Math.round(current.relative_humidity_2m ?? 0), wind: Math.round(current.wind_speed_10m ?? 0), precipitation: Number(current.precipitation ?? 0), code: Number(current.weather_code ?? 0) };
      }));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load world weather.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), REFRESH_MS); return () => window.clearInterval(timer); }, [load]);

  const paths = useMemo(() => features.map((f, i) => <path key={i} d={pathForGeometry(f.geometry)} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.7" />), [features]);
  const zoom = (factor: number) => setView(v => { const nw = Math.max(250, Math.min(1000, v.w * factor)); const nh = nw / 2; return { x: Math.max(0, Math.min(1000 - nw, v.x + (v.w - nw) / 2)), y: Math.max(0, Math.min(500 - nh, v.y + (v.h - nh) / 2)), w: nw, h: nh }; });
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 0.87); };
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y }; };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => { if (!drag.current) return; const rect = e.currentTarget.getBoundingClientRect(); const sx = view.w / rect.width; const sy = view.h / rect.height; setView(v => ({ ...v, x: Math.max(0, Math.min(1000 - v.w, drag.current!.viewX - (e.clientX - drag.current!.x) * sx)), y: Math.max(0, Math.min(500 - v.h, drag.current!.viewY - (e.clientY - drag.current!.y) * sy)) })); };
  const stopDrag = () => { drag.current = null; };

  return <GlassCard padding="lg">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-display text-xl font-extrabold text-ink-900">Live World Weather Map</h2><p className="mt-1 text-sm text-ink-500">Live current weather from Open-Meteo across major locations worldwide. Auto-refreshes every 10 minutes. Scroll to zoom and drag to move.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-ink-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </div>
    {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-brand-100 bg-sky-50 touch-none">
      {loading && points.length === 0 && <div className="absolute inset-0 z-10 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-brand-600" /></div>}
      <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="h-[360px] w-full cursor-grab active:cursor-grabbing text-brand-700" role="img" aria-label="Interactive world weather map" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        <rect x="0" y="0" width="1000" height="500" fill="white" fillOpacity="0.2" />
        {paths}
        {points.map(point => { const [x, y] = project(point.lon, point.lat); return <g key={point.name} onClick={(e) => { e.stopPropagation(); setSelected(point); }} className="cursor-pointer"><circle cx={x} cy={y} r={8} fill="currentColor" fillOpacity="0.15" /><circle cx={x} cy={y} r={4} fill="currentColor" /><title>{`${point.name}: ${point.temperature}°C, ${weatherLabel(point.code)}`}</title></g>; })}
      </svg>
      <div className="absolute bottom-3 right-3 flex gap-2"><button onClick={() => zoom(0.7)} className="h-9 w-9 rounded-xl bg-white/95 text-lg font-bold shadow" aria-label="Zoom in">+</button><button onClick={() => zoom(1.3)} className="h-9 w-9 rounded-xl bg-white/95 text-lg font-bold shadow" aria-label="Zoom out">−</button><button onClick={() => setView({ x: 0, y: 0, w: 1000, h: 500 })} className="rounded-xl bg-white/95 px-3 text-xs font-bold shadow">World</button></div>
    </div>
    {selected && <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-bold text-brand-800"><MapPin size={15} /> {selected.name}, {selected.country}</div><div className="mt-1 text-2xl font-extrabold text-ink-900">{selected.temperature}°C · {weatherLabel(selected.code)}</div></div><button onClick={() => setSelected(null)} className="text-xs font-bold text-ink-500">Close</button></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span className="rounded-xl bg-white p-2"><Thermometer size={14} /> {selected.temperature}°C</span><span className="rounded-xl bg-white p-2"><Droplets size={14} /> {selected.humidity}%</span><span className="rounded-xl bg-white p-2"><Wind size={14} /> {selected.wind} km/h</span></div><div className="mt-2 flex items-center gap-2 text-xs text-ink-500"><CloudRain size={14} /> Precipitation: {selected.precipitation} mm</div></div>}
    <div className="mt-3 text-xs text-ink-500">Tip: select a marker for current conditions. The map provides a live global overview; your farm's detailed forecast remains above.</div>
  </GlassCard>;
}
