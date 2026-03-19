import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = 'monolith_notes';

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export default function NotesWidget() {
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [...prev, { id: `${Date.now()}`, text, done: false }]);
    setInput('');
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTodo();
  };

  const pending = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);

  return (
    <div className="flex flex-col h-full w-full p-3 gap-2 overflow-hidden">
      <span className="t-label">Notes / Todo</span>
      <div className="flex gap-2 items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task..."
          className="flex-1 rounded-full px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          style={{ background: 'hsl(var(--surface-bright))' }}
          onClick={(e) => e.stopPropagation()}
        />
        <button onClick={(e) => { e.stopPropagation(); addTodo(); }} className="btn-pill p-2">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {pending.length === 0 && completed.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">No tasks yet — add one above</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {pending.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/5 transition-colors">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
              className="w-5 h-5 rounded-full border border-accent/40 flex items-center justify-center shrink-0 transition-colors hover:border-accent"
            />
            <span className="flex-1 text-sm text-foreground truncate">{todo.text}</span>
            <button onClick={(e) => { e.stopPropagation(); removeTodo(todo.id); }} className="opacity-0 group-hover:opacity-60 transition-opacity" aria-label="Remove">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {completed.map(todo => (
          <div key={todo.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg opacity-50">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }}
              className="w-5 h-5 rounded-full border border-accent/40 flex items-center justify-center shrink-0 bg-accent/20"
            >
              <Check className="w-3 h-3" />
            </button>
            <span className="flex-1 text-sm text-foreground truncate line-through">{todo.text}</span>
            <button onClick={(e) => { e.stopPropagation(); removeTodo(todo.id); }} className="opacity-0 group-hover:opacity-60 transition-opacity" aria-label="Remove">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {todos.length > 0 && (
        <div className="text-center">
          <span className="text-xs text-muted-foreground">{pending.length} pending · {completed.length} done</span>
        </div>
      )}
    </div>
  );
}
