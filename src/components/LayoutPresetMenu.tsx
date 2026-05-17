import { useEffect, useRef, useState } from 'react';
import { Layers, Plus, Check, Pencil, Trash2, Copy, Save, X } from 'lucide-react';
import { useLayoutPresets } from '@/hooks/useLayoutPresets';
import type { DashboardLayout } from '@/types/dashboard';

interface Props {
  layout: DashboardLayout;
  setLayout: (l: DashboardLayout) => void;
  visible: boolean;
}

export default function LayoutPresetMenu({ layout, setLayout, visible }: Props) {
  const { presets, activeId, apply, saveCurrentAs, overwrite, rename, remove, duplicate } =
    useLayoutPresets(layout, setLayout);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  // Restore last preset once on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (activeId && presets.find(p => p.id === activeId)) {
      const p = presets.find(x => x.id === activeId)!;
      setLayout(p.layout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const submitNew = () => {
    if (!name.trim()) return;
    saveCurrentAs(name);
    setName('');
    setCreating(false);
  };

  const submitRename = () => {
    if (renamingId) rename(renamingId, renameVal);
    setRenamingId(null);
    setRenameVal('');
  };

  return (
    <div
      className={`corner-btn top-4 right-4 ${visible || open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`btn-icon ${open ? 'accent' : ''}`}
        title="Layout Presets"
      >
        <Layers className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-12 right-0 w-64 animate-scale-in origin-top-right z-50"
          style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 12px 40px -8px hsl(var(--background) / 0.8), 0 0 0 1px hsl(var(--accent) / 0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="px-2 py-1.5 flex items-center justify-between">
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Layouts
            </span>
            <span className="text-[0.6rem] text-muted-foreground/50">{presets.length}</span>
          </div>

          <div className="max-h-64 overflow-y-auto scrollbar-hide flex flex-col gap-0.5">
            {presets.length === 0 && !creating && (
              <div className="px-2 py-4 text-center text-[0.7rem] text-muted-foreground/60">
                No presets yet
              </div>
            )}
            {presets.map(p => {
              const active = p.id === activeId;
              const renaming = renamingId === p.id;
              return (
                <div
                  key={p.id}
                  className="group flex items-center gap-1 rounded-lg px-2 py-1.5"
                  style={{ background: active ? 'hsl(var(--accent) / 0.12)' : 'transparent' }}
                >
                  {renaming ? (
                    <>
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename();
                          if (e.key === 'Escape') { setRenamingId(null); setRenameVal(''); }
                        }}
                        className="flex-1 bg-transparent text-xs outline-none border-b border-border/40 pb-0.5"
                      />
                      <button onClick={submitRename} className="btn-icon w-6 h-6">
                        <Check className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => apply(p.id)}
                        className="flex-1 text-left text-xs truncate flex items-center gap-1.5"
                        title={p.name}
                      >
                        {active && <Check className="w-3 h-3 text-accent shrink-0" />}
                        <span className={active ? 'text-foreground' : 'text-foreground/80'}>
                          {p.name}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => overwrite(p.id)}
                          className="btn-icon w-6 h-6"
                          title="Save current layout to this preset"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => { setRenamingId(p.id); setRenameVal(p.name); }}
                          className="btn-icon w-6 h-6"
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => duplicate(p.id)}
                          className="btn-icon w-6 h-6"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="btn-icon w-6 h-6"
                          title="Delete"
                          style={{ background: 'hsl(var(--destructive) / 0.12)' }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-1 pt-2 border-t border-border/30">
            {creating ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNew();
                    if (e.key === 'Escape') { setCreating(false); setName(''); }
                  }}
                  placeholder="Preset name..."
                  className="flex-1 bg-transparent text-xs outline-none border-b border-border/40 px-1 pb-0.5"
                />
                <button onClick={submitNew} className="btn-icon w-6 h-6">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => { setCreating(false); setName(''); }} className="btn-icon w-6 h-6">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[0.7rem] text-foreground/70 hover:text-foreground hover:bg-accent/10 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Save current layout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
