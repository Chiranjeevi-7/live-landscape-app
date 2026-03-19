import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, CloudFog } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

const CONDITION_ICONS: Record<string, React.ReactNode> = {
  Clear: <Sun className="w-8 h-8" />,
  Clouds: <Cloud className="w-8 h-8" />,
  Rain: <CloudRain className="w-8 h-8" />,
  Drizzle: <CloudRain className="w-8 h-8" />,
  Snow: <CloudSnow className="w-8 h-8" />,
  Thunderstorm: <CloudLightning className="w-8 h-8" />,
  Mist: <CloudFog className="w-8 h-8" />,
  Fog: <CloudFog className="w-8 h-8" />,
  Haze: <CloudFog className="w-8 h-8" />,
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        const data = await res.json();
        const current = data.current;

        const code = current.weather_code;
        let condition = 'Clear';
        if (code >= 1 && code <= 3) condition = 'Clouds';
        else if (code >= 45 && code <= 48) condition = 'Fog';
        else if (code >= 51 && code <= 67) condition = 'Rain';
        else if (code >= 71 && code <= 77) condition = 'Snow';
        else if (code >= 80 && code <= 82) condition = 'Rain';
        else if (code >= 85 && code <= 86) condition = 'Snow';
        else if (code >= 95) condition = 'Thunderstorm';

        let city = `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`
          );
          const geoData = await geoRes.json();
          city = geoData.address?.city || geoData.address?.town || geoData.address?.village || city;
        } catch { /* fallback coords */ }

        setWeather({
          temp: Math.round(current.temperature_2m),
          condition,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          city,
        });
      } catch {
        setError('Failed to fetch weather');
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(40.7128, -74.006)
      );
    } else {
      fetchWeather(40.7128, -74.006);
    }

    const id = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(40.7128, -74.006)
        );
      }
    }, 900000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
        <span className="t-label">Weather</span>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
        <span className="t-label">Weather</span>
        <span className="text-sm text-muted-foreground">{error || 'Unavailable'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
      <span className="t-label">{weather.city}</span>
      <div className="flex items-center gap-3">
        {CONDITION_ICONS[weather.condition] || <Cloud className="w-8 h-8" />}
        <span className="t-display text-3xl">{weather.temp}°</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.humidity}%</span>
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{weather.windSpeed} km/h</span>
      </div>
      <span className="text-xs text-muted-foreground">{weather.condition}</span>
    </div>
  );
}
