'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/components/I18nContext';
import { useRouter } from 'next/navigation';
import { X, Send, Bot, User, Loader2, Zap } from 'lucide-react';
import clsx from 'clsx';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AIChat({ onRefresh }: { onRefresh?: () => void }) {
    const { t } = useI18n();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
        };
        
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: updatedMessages }),
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const text = await response.text();
            
            setMessages([...updatedMessages, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: text,
            }]);

            // Refresh dopo risposta (potrebbe aver modificato dati)
            setTimeout(() => {
                router.refresh();
                if (onRefresh) onRefresh();
            }, 1000);
        } catch (err) {
            console.error('Chat error:', err);
            setMessages([...updatedMessages, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Errore nella chiamata. Riprova.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group",
                    isOpen
                        ? "bg-slate-900 text-white rotate-90"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/40"
                )}
            >
                {isOpen ? <X size={28} /> : <Zap size={28} className="fill-current" />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-100 h-150 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col animate-in slide-in-from-bottom">
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center gap-4 border-b border-white/20">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Zap size={24} className="fill-current" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight">
                                AI Assistant
                            </h3>
                            <p className="text-white/80 text-xs font-medium">
                                Gestisci i tuoi log
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4"
                    >
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-50">
                                    Chiedi di vedere i tuoi log o registrare ore
                                </p>
                            </div>
                        )}

                        {messages.map((m: Message) => {
                            const isUser = m.role === 'user';
                            return (
                                <div key={m.id} className={clsx("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                                    {!isUser && (
                                        <div className={clsx(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                            "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                                        )}>
                                            <Bot size={18} />
                                        </div>
                                    )}
                                    <div className={clsx(
                                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                        isUser
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                            : "bg-white/60 text-slate-800 border border-white shadow-sm"
                                    )}>
                                        {m.content}
                                    </div>
                                    {isUser && (
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-200 text-slate-700">
                                            <User size={18} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                    <Bot size={18} />
                                </div>
                                <div className="bg-white/60 rounded-2xl px-4 py-3 text-sm border border-white shadow-sm">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                    {isLoading && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-tighter text-blue-600 animate-pulse w-fit">
                                            <Loader2 size={12} className="animate-spin" />
                                            {t('common.logging')}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white/50 border-t border-white backdrop-blur-sm">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Scrivi un messaggio..."
                                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
