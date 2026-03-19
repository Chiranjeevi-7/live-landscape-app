import { useState } from 'react';

const DEFAULT_GIF = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWlxYWQ2bW4wMjM2d2tkdHQzNzBtNWVkOGR1eHk4cmRyY21vYmQ1YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlBO7eyXzSZkJri/giphy.gif';

export default function GifWidget() {
  const [url, setUrl] = useState(DEFAULT_GIF);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(url);

  const handleSave = () => {
    if (input.trim()) setUrl(input.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-full w-full p-3 gap-2">
      <span className="t-label">GIF / Image</span>
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
        <img
          src={url}
          alt="Widget GIF"
          className="w-full h-full object-cover cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        />
      </div>
      {editing && (
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md px-3 py-1.5 text-foreground text-sm outline-none"
            style={{ background: 'hsl(var(--surface-bright))' }}
            placeholder="Paste GIF URL..."
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="btn-pill text-xs py-1.5">Save</button>
        </div>
      )}
    </div>
  );
}
