import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, CloudFog } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

const ICONS: Record<string, React.ReactNode> = {
  Clear: <Sun className="w-7 h-7" />,
  Clouds: <Cloud className="w-7 h-7" />,
  Rain: <CloudRain className="w-7 h-7" />,
  Drizzle: <CloudRain className="w-7 h-7" />,
  Snow: <CloudSnow className="w-7 h-7" />,
  Thunderstorm: <CloudLightning className="w-7 h-7" />,
  Mist: <CloudFog className="w-7 h-7" />,
  Fog: <CloudFog className="w-7 h-7" />,
  Haze: <CloudFog className="w-7 h-7" />,
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        const data = await res.json();
        const c = data.current;

        const code = c.weather_code;
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
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
          const g = await geo.json();
          city = g.address?.city || g.address?.town || g.address?.village || city;
        } catch {}

        setWeather({ temp: Math.round(c.temperature_2m), condition, humidity: c.relative_humidity_2m, windSpeed: Math.round(c.wind_speed_10m), city });
      } catch {
        setWeather({ temp: 22, condition: 'Clear', humidity: 45, windSpeed: 12, city: 'Demo' });
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWeather(p.coords.latitude, p.coords.longitude),
        () => fetchWeather(40.7128, -74.006)
      );
    } else {
      fetchWeather(40.7128, -74.006);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2 p-4">
      <span className="t-label">{weather.city}</span>
      <div className="flex items-center gap-3">
        <span className="text-accent">{ICONS[weather.condition] || <Cloud className="w-7 h-7" />}</span>
        <span className="t-display text-3xl">{weather.temp}°</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{weather.humidity}%</span>
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{weather.windSpeed} km/h</span>
      </div>
    </div>
  );
}
