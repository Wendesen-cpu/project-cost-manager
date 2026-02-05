'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/components/I18nContext';
import { useRouter } from 'next/navigation';
import {
    MessageSquare,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    ChevronDown,
    Zap
} from 'lucide-react';
import clsx from 'clsx';

export function AIChat() {
    const { t } = useI18n();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const hasCalledToolInCurrentRequest = useRef(false);

    const { messages, sendMessage, status, error, stop } = useChat({
        id: 'main-chat',
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onFinish: ({ messages: updatedMessages }) => {
            console.log('Chat finished. Tool called in this cycle:', hasCalledToolInCurrentRequest.current);

            // Check message parts directly as a secondary check
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            const containsTools = (lastMessage as any).parts.some((p: any) => p.type === 'tool-invocation');

            if (hasCalledToolInCurrentRequest.current || containsTools) {
                console.log('Triggering dashboard refresh...');
                router.refresh();

                // Force a reload after a short delay to ensure everything is captured
                setTimeout(() => {
                    console.log('Forcing full page reload for data consistency...');
                    router.refresh();
                    hasCalledToolInCurrentRequest.current = false;
                }, 1000);
            }
        }
    });

    // Reset tool tracker when starting a new message
    useEffect(() => {
        if (status === 'submitted') {
            hasCalledToolInCurrentRequest.current = false;
        }
        if (status === 'streaming') {
            const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
            if (lastAssistantMessage) {
                const hasTools = (lastAssistantMessage as any).parts.some((p: any) => p.type === 'tool-invocation');
                if (hasTools) hasCalledToolInCurrentRequest.current = true;
            }
        }
    }, [status, messages]);

    // isLoading is status !== 'ready' and status !== 'error' (but usually just !== 'ready')
    const isLoading = status === 'submitted' || status === 'streaming';

    // Check if performing tool
    const isPerformingTask = isLoading && (
        hasCalledToolInCurrentRequest.current ||
        (messages.length > 0 && (messages[messages.length - 1] as any).parts.some((p: any) =>
            p.type === 'tool-invocation' && p.toolInvocation.state !== 'result'
        ))
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const currentInput = input;
        setInput('');

        await sendMessage({
            text: currentInput,
        });
    };

    const scrollRef = useRef<HTMLDivElement>(null);

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

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-blue-400 mb-0.5">Assistant</h3>
                                <p className="font-bold text-sm tracking-tight">{t('aiChat.title')}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-[200px]">
                                    {t('aiChat.welcomeMessage')}
                                </p>
                            </div>
                        )}

                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={clsx(
                                    "flex items-start gap-3",
                                    m.role === 'user' ? "flex-row-reverse" : ""
                                )}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={clsx(
                                    "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                                    m.role === 'user'
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                )}>
                                    {m.parts.map((part: any, i: number) => {
                                        if (part.type === 'text') {
                                            return <p key={i}>{part.text}</p>;
                                        }
                                        if (part.type === 'tool-invocation') {
                                            const { toolName, state } = part.toolInvocation;
                                            return (
                                                <div key={i} className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                                    {state === 'call' ? (
                                                        <>
                                                            <Loader2 size={12} className="animate-spin" />
                                                            {toolName === 'logWork' ? t('common.logging') : 'Processing activity'}...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                            Task complete
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center animate-pulse">
                                    <Bot size={16} />
                                </div>
                                <div className="space-y-2 max-w-[80%]">
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 w-fit">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                    {isLoading && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-tighter text-blue-600 animate-pulse w-fit">
                                            <Loader2 size={12} className="animate-spin" />
                                            {isPerformingTask ? t('common.logging') : 'Assistant is thinking'}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest">
                                Error: {error.message}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="relative">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder={t('aiChat.placeholder')}
                                className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-xs uppercase tracking-widest text-slate-700 placeholder:text-slate-300 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 top-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
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
