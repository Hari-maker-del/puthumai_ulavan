# Production Weather Architecture

- Production browser requests `/api/weather`.
- `api/weather.js` keeps `OPENWEATHER_API_KEY` server-side.
- OpenWeather is preferred when `OPENWEATHER_API_KEY` is valid.
- Open-Meteo is used as a real-data fallback when the OpenWeather key is missing or rejected.
- No mock/fake weather data is generated.
- Local `npm run dev` can use `VITE_OPENWEATHER_API_KEY`; production must use `OPENWEATHER_API_KEY`.
- For local Vercel Function testing, use `vercel dev`.
