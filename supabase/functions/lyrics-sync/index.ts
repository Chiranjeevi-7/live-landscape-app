import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { track_name, artist_name, album_name, duration } = await req.json();

    if (!track_name || !artist_name) {
      return new Response(JSON.stringify({ error: 'track_name and artist_name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try LRCLIB for synced lyrics
    const params = new URLSearchParams({
      track_name,
      artist_name,
    });
    if (album_name) params.set('album_name', album_name);
    if (duration) params.set('duration', String(Math.round(duration)));

    const lrcRes = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { 'User-Agent': 'SeeItLive/1.0 (https://lovable.dev)' },
    });

    if (lrcRes.ok) {
      const data = await lrcRes.json();
      
      if (data.syncedLyrics) {
        // Parse LRC format: [mm:ss.xx] text
        const lines = parseLRC(data.syncedLyrics);
        return new Response(JSON.stringify({ 
          synced: true, 
          lines,
          source: 'lrclib',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (data.plainLyrics) {
        const lines = data.plainLyrics.split('\n').map((text: string, i: number) => ({
          time: i * 5000, // rough estimate
          text: text.trim(),
        })).filter((l: { text: string }) => l.text.length > 0);
        
        return new Response(JSON.stringify({ 
          synced: false, 
          lines,
          source: 'lrclib',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fallback: search LRCLIB
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(`${artist_name} ${track_name}`)}`, {
      headers: { 'User-Agent': 'SeeItLive/1.0 (https://lovable.dev)' },
    });

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find best match with synced lyrics
        const withSynced = results.find((r: any) => r.syncedLyrics);
        const best = withSynced || results[0];

        if (best.syncedLyrics) {
          return new Response(JSON.stringify({
            synced: true,
            lines: parseLRC(best.syncedLyrics),
            source: 'lrclib',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (best.plainLyrics) {
          const lines = best.plainLyrics.split('\n').map((text: string, i: number) => ({
            time: i * 5000,
            text: text.trim(),
          })).filter((l: { text: string }) => l.text.length > 0);

          return new Response(JSON.stringify({
            synced: false,
            lines,
            source: 'lrclib',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(JSON.stringify({ synced: false, lines: [], source: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseLRC(lrc: string): { time: number; text: string }[] {
  const lines: { time: number; text: string }[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/g;
  let match;

  while ((match = regex.exec(lrc)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    let ms = parseInt(match[3], 10);
    if (match[3].length === 2) ms *= 10; // convert centiseconds to milliseconds
    
    const time = minutes * 60000 + seconds * 1000 + ms;
    const text = match[4].trim();
    
    if (text.length > 0) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
