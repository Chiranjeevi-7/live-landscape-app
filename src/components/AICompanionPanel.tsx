import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const AI_RESPONSES = [
  "I can help you organize your dashboard. Try adding a Pomodoro widget for productivity!",
  "Here's a tip: You can stack multiple widgets in one panel by using the + button in edit mode.",
  "The weather looks great today! Perfect for a focused work session.",
  "Did you know you can cycle through different clock faces? Each one has a unique style.",
  "Try Focus Mode to minimize distractions and concentrate on what matters.",
  "I recommend setting up your notes widget for quick capture of ideas throughout the day.",
  "Your dashboard layout is saved automatically. You can always rearrange it later!",
  "For ambient music, check out the Spotify widget — it integrates beautifully with your setup.",
  "Pro tip: Use the squircle shape for a modern, iOS-inspired look on your widgets.",
  "Need a break? The timer widget is perfect for structured rest intervals.",
];

function getAIResponse(): string {
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AICompanionPanel({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('ai_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: getAIResponse(),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  }, [input]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-[60] transition-all duration-500 ease-out ${
        isExpanded
          ? 'inset-4'
          : 'right-4 top-4 bottom-4 w-80'
      }`}
      style={{ pointerEvents: 'auto' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="h-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(var(--background) / 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid hsl(var(--accent) / 0.2)',
          boxShadow: '0 8px 40px hsl(0 0% 0% / 0.5), 0 0 60px hsl(var(--accent-glow))',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--accent) / 0.15)' }}
            >
              <Bot className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">AI Companion</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[0.6rem] text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /> : <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
              <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--accent))' }} />
              <p className="text-sm text-muted-foreground">Ask me anything about your dashboard, productivity tips, or just say hi!</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed transition-all duration-300 ${
                  msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={msg.role === 'user'
                  ? { background: 'hsl(var(--accent) / 0.2)', color: 'hsl(var(--foreground))' }
                  : { background: 'hsl(var(--surface-bright))', color: 'hsl(var(--foreground))' }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: 'hsl(var(--surface-bright))' }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: 'hsl(var(--accent))',
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '0.6s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--accent-subtle))' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Ask your companion..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-30"
              style={{ background: input.trim() ? 'hsl(var(--accent) / 0.2)' : 'transparent' }}
            >
              <Send className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
