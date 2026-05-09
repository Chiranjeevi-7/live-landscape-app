import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, Link2, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'monolith_gif_widget_media';

interface SavedMedia {
  src: string;       // url or dataURL
  kind: 'url' | 'file';
}

function loadMedia(): SavedMedia | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMedia(m: SavedMedia | null) {
  if (m) localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  else localStorage.removeItem(STORAGE_KEY);
}

export default function GifWidget() {
  const [media, setMedia] = useState<SavedMedia | null>(() => loadMedia());
  const [editing, setEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveMedia(media); }, [media]);
  useEffect(() => { setLoaded(false); }, [media?.src]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMedia({ src: reader.result as string, kind: 'file' });
      setEditing(false);
    };
    reader.readAsDataURL(file);
  };

  const saveUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    setMedia({ src: v, kind: 'url' });
    setUrlInput('');
    setEditing(false);
  };

  const clear = () => {
    setMedia(null);
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ borderRadius: 'inherit' }}>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />

      {/* Media or placeholder */}
      <div className="flex-1 min-h-0 overflow-hidden relative" style={{ borderRadius: 'inherit' }}>
        {media ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground/30 animate-pulse" />
              </div>
            )}
            <img
              src={media.src}
              alt="Widget media"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover cursor-pointer transition-opacity duration-500"
              style={{ opacity: loaded ? 1 : 0 }}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            />
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="w-full h-full flex flex-col items-center justify-center gap-2 transition-colors hover:bg-foreground/5"
          >
            <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Add image or GIF</span>
          </button>
        )}
      </div>

      {/* Edit panel */}
      {editing && (
        <div
          className="absolute inset-0 z-10 flex flex-col gap-3 p-4 animate-fade-in"
          style={{ background: 'hsl(var(--surface) / 0.96)', backdropFilter: 'blur(14px)', borderRadius: 'inherit' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="t-label">Media</span>
            <button onClick={() => setEditing(false)} className="btn-icon w-7 h-7"><X className="w-3.5 h-3.5" /></button>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="btn-native text-xs py-2 flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" /> Upload from device
          </button>

          <div className="flex gap-2 items-center">
            <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="input-native flex-1 py-2 text-sm min-w-0"
              placeholder="Paste image / GIF URL"
              onKeyDown={(e) => e.key === 'Enter' && saveUrl()}
            />
            <button onClick={saveUrl} className="btn-native accent text-xs py-2">Save</button>
          </div>

          {media && (
            <button
              onClick={clear}
              className="btn-native text-xs py-2 flex items-center justify-center gap-2 mt-auto"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
          <p className="text-[0.65rem] text-muted-foreground/70 text-center">JPG · PNG · WEBP · GIF</p>
        </div>
      )}
    </div>
  );
}
