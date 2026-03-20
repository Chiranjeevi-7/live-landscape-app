import { useState } from 'react';
import { Image } from 'lucide-react';

const DEFAULT_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWlxYWQ2bW4wMjM2d2tkdHQzNzBtNWVkOGR1eHk4cmRyY21vYmQ1YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlBO7eyXzSZkJri/giphy.gif';

export default function GifWidget() {
  const [url, setUrl] = useState(DEFAULT_GIF);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(url);
  const [loaded, setLoaded] = useState(false);

  const save = () => { if (input.trim()) setUrl(input.trim()); setEditing(false); };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      <div className="flex-1 min-h-0 overflow-hidden" style={{ borderRadius: 'inherit' }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <img
          src={url}
          alt="Widget"
          className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        />
      </div>
      {editing && (
        <div className="absolute bottom-0 left-0 right-0 p-2" style={{ background: 'hsl(var(--surface) / 0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-native flex-1 py-2 text-sm"
              placeholder="Paste image URL..."
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <button onClick={(e) => { e.stopPropagation(); save(); }} className="btn-native accent text-xs py-2">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
