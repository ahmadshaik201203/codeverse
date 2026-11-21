'use client';

import React, { useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { apiFetchRaw } from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function GlobalAiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi — I am the CodeVerse copilot. Ask me about architecture, debugging, roadmaps, or technical concepts.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const res = await apiFetchRaw('/mentor/ask', {
        method: 'POST',
        body: JSON.stringify({
          taskContext: 'Global Copilot Assistant Question',
          codeSnippet: '',
          userMessage: userText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const payload = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              payload?.error?.message ||
              'The copilot is unavailable right now. Your question was not answered.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'The mentor service is unreachable. Check the server connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ask copilot — open the CodeVerse copilot"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-[12.5px] font-medium text-ivory-warm shadow-[0_12px_30px_-14px_rgba(37,40,39,0.8)] transition-colors duration-200 hover:bg-forest-deep"
        >
          <Bot className="h-4 w-4" aria-hidden="true" />
          Ask copilot
        </button>
      ) : (
        <div className="surface-strong flex h-[440px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-card">
          <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-4 py-3">
            <span className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-forest" aria-hidden="true" />
              <span className="text-[13px] font-medium text-ink">CodeVerse copilot</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close the copilot"
              className="inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-ink/[0.06]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-[12px] px-3 py-2 text-[12.5px] leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-[4px] bg-forest text-ivory-warm'
                      : 'rounded-bl-[4px] border border-ink/10 bg-ivory-warm/80 text-ink-soft'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading ? (
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">Thinking…</p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-ink/10 p-3">
            <label htmlFor="copilot-input" className="sr-only">
              Message the copilot
            </label>
            <input
              id="copilot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything…"
              className="control h-10"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-forest text-ivory-warm transition-colors hover:bg-forest-deep disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
