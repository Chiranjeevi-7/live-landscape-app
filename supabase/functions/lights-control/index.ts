import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/**
 * Lights relay. Forwards a normalized command to one of three backends.
 *
 * Body:
 *   {
 *     backend: 'webhook' | 'home_assistant' | 'google',
 *     config:  { ...backend-specific },
 *     command: { on, brightness, color?, warmth?, mode, scene? }
 *   }
 *
 * Response: { ok: true, status, body? } or { ok: false, error }
 *
 * Notes:
 *  - 'google' uses an Assistant-Relay style endpoint (assistant-relay,
 *    Home Assistant's Google Assistant relay, IFTTT, etc.) — we POST a
 *    natural-language command. Direct Smart Home API access requires the
 *    caller to *be* a Smart Home provider, which is impractical here.
 */

type Command = {
  on: boolean;
  brightness: number;
  color?: string;
  warmth?: number;
  mode: 'color' | 'white';
  scene?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function describe(cmd: Command, deviceName: string): string {
  if (!cmd.on) return `turn off ${deviceName}`;
  if (cmd.scene) return `set ${deviceName} to ${cmd.scene} mode`;
  const parts = [`turn on ${deviceName}`];
  parts.push(`set ${deviceName} brightness to ${cmd.brightness} percent`);
  if (cmd.mode === 'color' && cmd.color) {
    const { r, g, b } = hexToRgb(cmd.color);
    parts.push(`set ${deviceName} color to RGB ${r} ${g} ${b}`);
  } else if (cmd.mode === 'white' && typeof cmd.warmth === 'number') {
    parts.push(`set ${deviceName} to ${cmd.warmth > 50 ? 'warm white' : 'cool white'}`);
  }
  return parts.join('; ');
}

async function callWebhook(config: any, command: Command) {
  const url: string = config?.url;
  if (!url) throw new Error('webhook.url is required');
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config?.token ? { Authorization: `Bearer ${config.token}` } : {}),
    },
    body: JSON.stringify({ source: 'monolith-dashboard', command }),
  });
  return { status: r.status, body: await r.text().catch(() => '') };
}

async function callHomeAssistant(config: any, command: Command) {
  const baseUrl: string = (config?.baseUrl || '').replace(/\/$/, '');
  const token: string = config?.token;
  const entityId: string = config?.entityId;
  if (!baseUrl || !token || !entityId) {
    throw new Error('home_assistant requires baseUrl, token, entityId');
  }
  const service = command.on ? 'turn_on' : 'turn_off';
  const payload: Record<string, unknown> = { entity_id: entityId };
  if (command.on) {
    payload.brightness_pct = command.brightness;
    if (command.mode === 'color' && command.color) {
      const { r, g, b } = hexToRgb(command.color);
      payload.rgb_color = [r, g, b];
    } else if (command.mode === 'white' && typeof command.warmth === 'number') {
      // 153 (cool) - 500 (warm) mireds
      payload.color_temp = Math.round(153 + (command.warmth / 100) * (500 - 153));
    }
  }
  const r = await fetch(`${baseUrl}/api/services/light/${service}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return { status: r.status, body: await r.text().catch(() => '') };
}

async function callGoogle(config: any, command: Command) {
  const url: string = config?.relayUrl;
  const token: string | undefined = config?.token;
  const deviceName: string = config?.deviceName || 'lights';
  if (!url) throw new Error('google.relayUrl is required (Assistant Relay endpoint)');
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      command: describe(command, deviceName),
      converse: false,
    }),
  });
  return { status: r.status, body: await r.text().catch(() => '') };
}

/**
 * Magic Home / Flux LED via a local HTTP bridge.
 * Supabase edge functions can't reach private LAN IPs (192.168.x.x) directly,
 * so this only works when the user has exposed their bridge through a public
 * tunnel (Tailscale Funnel, Cloudflare Tunnel, ngrok…) and pasted that URL
 * as `bridgeUrl`. The client also tries the LAN address directly, so this
 * path is just the relayed fallback.
 */
async function callMagicHome(config: any, command: Command) {
  const url: string | undefined = config?.bridgeUrl;
  if (!url) {
    return { status: 200, body: 'client-LAN-only' };
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'monolith-dashboard', command }),
  });
  return { status: r.status, body: await r.text().catch(() => '') };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const { backend, config, command } = await req.json();
    if (!backend || !command) {
      return new Response(JSON.stringify({ ok: false, error: 'backend and command required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: { status: number; body: string };
    switch (backend) {
      case 'magic_home':     result = await callMagicHome(config || {}, command); break;
      case 'webhook':        result = await callWebhook(config || {}, command); break;
      case 'home_assistant': result = await callHomeAssistant(config || {}, command); break;
      case 'google':         result = await callGoogle(config || {}, command); break;
      default:
        return new Response(JSON.stringify({ ok: false, error: `unknown backend: ${backend}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const ok = result.status >= 200 && result.status < 300;
    return new Response(JSON.stringify({ ok, ...result }), {
      status: ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});