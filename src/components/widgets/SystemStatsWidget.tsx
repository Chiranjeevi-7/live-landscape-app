import { useState, useEffect } from 'react';
import { Battery, Cpu, Wifi, Clock, Activity } from 'lucide-react';

interface Stats {
  battery: number;
  charging: boolean;
  uptime: string;
  cpuLoad: number;
  memUsage: number;
  online: boolean;
}

function formatUptime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return `${h}h ${m}m`;
}

export default function SystemStatsWidget() {
  const [stats, setStats] = useState<Stats>({
    battery: 85,
    charging: false,
    uptime: formatUptime(),
    cpuLoad: 0,
    memUsage: 0,
    online: navigator.onLine,
  });

  useEffect(() => {
    // Try real Battery API
    const getBattery = async () => {
      try {
        const nav = navigator as any;
        if (nav.getBattery) {
          const batt = await nav.getBattery();
          setStats(s => ({
            ...s,
            battery: Math.round(batt.level * 100),
            charging: batt.charging,
          }));
          batt.addEventListener('levelchange', () => {
            setStats(s => ({ ...s, battery: Math.round(batt.level * 100) }));
          });
          batt.addEventListener('chargingchange', () => {
            setStats(s => ({ ...s, charging: batt.charging }));
          });
        }
      } catch { /* simulate */ }
    };
    getBattery();

    const onlineHandler = () => setStats(s => ({ ...s, online: true }));
    const offlineHandler = () => setStats(s => ({ ...s, online: false }));
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    // Simulate CPU/mem
    const interval = setInterval(() => {
      setStats(s => ({
        ...s,
        uptime: formatUptime(),
        cpuLoad: Math.min(100, Math.max(5, s.cpuLoad + (Math.random() - 0.5) * 20)),
        memUsage: Math.min(90, Math.max(20, s.memUsage + (Math.random() - 0.5) * 10)),
      }));
    }, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  const bars = [
    { label: 'CPU', value: stats.cpuLoad, icon: Cpu },
    { label: 'MEM', value: stats.memUsage, icon: Activity },
    { label: 'BAT', value: stats.battery, icon: Battery },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center px-4 py-3 gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="t-label !mb-0">System</span>
        <div className="flex items-center gap-2">
          <Wifi className={`w-3 h-3 ${stats.online ? 'text-emerald-400' : 'text-destructive'}`} />
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[0.6rem] text-muted-foreground">{stats.uptime}</span>
          </div>
          {stats.charging && (
            <span className="text-[0.55rem] text-emerald-400">⚡</span>
          )}
        </div>
      </div>

      {bars.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[0.6rem] text-muted-foreground w-6">{label}</span>
          <div className="flex-1 progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.round(value)}%`, transition: 'width 1s ease' }}
            />
          </div>
          <span className="text-[0.6rem] text-foreground/70 w-7 text-right tabular-nums">
            {Math.round(value)}%
          </span>
        </div>
      ))}
    </div>
  );
}
