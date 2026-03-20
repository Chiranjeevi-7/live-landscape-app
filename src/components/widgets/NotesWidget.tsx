import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface TodoItem { id: string; text: string; done: boolean; }

const STORAGE_KEY = 'monolith_notes';

function load(): TodoItem[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  return [];
}

export default function NotesWidget() {
  const [todos, setTodos] = useState<TodoItem[]>(load);
  const [input, setInput] = useState('');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }, [todos]);

  const add = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    setTodos(p => [...p, { id: `${Date.now()}`, text: t, done: false }]);
    setInput('');
  }, [input]);

  const toggle = useCallback((id: string) => {
    setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const remove = useCallback((id: string) => {
    setTodos(p => p.filter(t => t.id !== id));
  }, []);

  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  return (
    <div className="flex flex-col h-full w-full p-3 gap-2 overflow-hidden">
      <div className="flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a task..."
          className="input-native flex-1 py-2 text-sm"
          style={{ borderRadius: '100px', paddingLeft: '14px', paddingRight: '14px' }}
          onClick={(e) => e.stopPropagation()}
        />
        <button onClick={(e) => { e.stopPropagation(); add(); }} className="btn-icon accent w-8 h-8">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {pending.length === 0 && done.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No tasks yet</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {pending.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 px-2 py-2 rounded-xl transition-colors" style={{ background: 'transparent' }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggle(todo.id); }}
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
              style={{ border: '2px solid hsl(var(--muted-foreground) / 0.3)' }}
            />
            <span className="flex-1 text-sm text-foreground truncate">{todo.text}</span>
            <button onClick={(e) => { e.stopPropagation(); remove(todo.id); }} className="opacity-0 group-hover:opacity-60 transition-opacity active:scale-90">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {done.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 px-2 py-2 rounded-xl opacity-40">
            <button
              onClick={(e) => { e.stopPropagation(); toggle(todo.id); }}
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 active:scale-90"
              style={{ background: 'hsl(var(--accent) / 0.2)', border: '2px solid hsl(var(--accent) / 0.3)' }}
            >
              <Check className="w-3 h-3 text-accent" />
            </button>
            <span className="flex-1 text-sm text-foreground truncate line-through">{todo.text}</span>
            <button onClick={(e) => { e.stopPropagation(); remove(todo.id); }} className="opacity-0 group-hover:opacity-60 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {todos.length > 0 && (
        <div className="text-center">
          <span className="text-[0.65rem] text-muted-foreground">{pending.length} pending · {done.length} done</span>
        </div>
      )}
    </div>
  );
}
