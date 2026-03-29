"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Send, ArrowLeft, Sparkles, MessageCircle, X, Loader2 } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface BaseAIAssistantProps {
    isDarkMode: boolean;
    onClose: () => void;
}

const BASE_SYSTEM_PROMPT = `You are the "Base Chain Expert" — an elite AI dedicated EXCLUSIVELY to answering questions about **Base chain** and the broader **Base ecosystem**.

RULES:
1. ONLY answer questions related to Base chain, its ecosystem, DeFi on Base, NFTs on Base, smart contracts on Base, the OP Stack, Superchain, Coinbase integrations with Base, wallets on Base, bridging to Base, USDC on Base, Farcaster, Basenames, Aerodrome, and related onchain topics.
2. If the user asks about something NOT related to Base chain (like general JavaScript, Python, cooking, etc.), politely redirect them: "I'm specialized in Base chain only! Try asking about Base DeFi, smart contracts, bridging, or the ecosystem. 🔵"
3. Be friendly, concise, and technically accurate.
4. Use code examples when explaining smart contract or development topics.
5. Always mention relevant contract addresses, tools, or links when applicable.
6. Keep answers focused and under 200 words unless a deep technical explanation is needed.
7. Use markdown formatting: **bold** for key terms, \`code\` for addresses/functions, and code blocks for examples.`;

const QUICK_QUESTIONS = [
    { q: "What is Base chain?", emoji: "🔵", category: "Fundamentals" },
    { q: "How do gas fees work on Base?", emoji: "⛽", category: "Fees" },
    { q: "How to deploy a smart contract on Base?", emoji: "📝", category: "Development" },
    { q: "What is the OP Stack?", emoji: "🏗️", category: "Architecture" },
    { q: "How to bridge ETH to Base?", emoji: "🌉", category: "Bridging" },
    { q: "What is USDC on Base?", emoji: "💵", category: "Stablecoins" },
    { q: "What is Aerodrome DEX?", emoji: "💰", category: "DeFi" },
    { q: "What are Basenames?", emoji: "👤", category: "Identity" },
    { q: "What is Farcaster and Frames?", emoji: "📱", category: "Social" },
    { q: "How to use OnchainKit?", emoji: "⚒️", category: "SDK" },
    { q: "What are AI agents on Base?", emoji: "🤖", category: "AI" },
    { q: "Is Base decentralized?", emoji: "🔐", category: "Security" },
];

export function BaseAIAssistant({ isDarkMode, onClose }: BaseAIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([{
        id: "welcome",
        role: "assistant",
        content: `Hey! 🔵 I'm your **Base Chain AI Expert**.

I can answer anything about the **Base ecosystem**:
• Smart contracts & deployment
• DeFi (Aerodrome, Moonwell, lending)
• NFTs, Basenames & identity
• Bridging, USDC, wallets
• OP Stack & Superchain architecture

Ask me anything about Base! 🚀`,
    }]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: trimmed,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: trimmed,
                    history: messages.map(({ role, content }) => ({ role, content })),
                    language: "en-US",
                    mode: "base-ai",
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const reply = data.message || "Sorry, I couldn't process that. Please try again.";

            setMessages(prev => [...prev, {
                id: String(Date.now() + 1),
                role: "assistant",
                content: reply,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: String(Date.now()),
                role: "assistant",
                content: "⚠️ Connection error. Please check your internet and try again.",
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, messages]);

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const renderInline = (text: string) => {
        return text.split(/(```[\s\S]*?```|\*\*[^*]+\*\*|`[^`]+`)/).map((seg, i) => {
            if (seg.startsWith("```") && seg.endsWith("```")) {
                const code = seg.slice(3, -3).replace(/^\w*\n/, "");
                return (
                    <pre key={i} className="my-3 p-4 rounded-xl bg-[#0d1117] border border-white/5 text-xs font-mono text-emerald-400 overflow-x-auto">
                        <code>{code}</code>
                    </pre>
                );
            }
            if (seg.startsWith("**") && seg.endsWith("**"))
                return <strong key={i} className="text-blue-400 font-bold">{seg.slice(2, -2)}</strong>;
            if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2)
                return <code key={i} className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px] border border-blue-500/20">{seg.slice(1, -1)}</code>;
            return <span key={i}>{seg}</span>;
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="max-w-3xl mx-auto"
        >
            {/* Header */}
            <div className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-extrabold text-foreground tracking-tight">Base AI Expert</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-bold text-muted-foreground">
                                    {loading ? "Thinking..." : "Online • Base Only"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-rose-500/10 transition-colors group"
                    >
                        <X className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="h-[420px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                msg.role === "user"
                                    ? "bg-slate-600 text-white"
                                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                            }`}>
                                {msg.role === "user" ? "U" : "🔵"}
                            </div>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.role === "user"
                                    ? "bg-blue-500 text-white rounded-br-md"
                                    : `${isDarkMode ? "bg-slate-800/80 border border-slate-700/50" : "bg-slate-100 border border-slate-200"} text-foreground rounded-bl-md`
                            }`}>
                                {msg.role === "user" ? msg.content : renderInline(msg.content)}
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] shrink-0">🔵</div>
                            <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${isDarkMode ? "bg-slate-800/80 border border-slate-700/50" : "bg-slate-100 border border-slate-200"}`}>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                    <span className="text-xs text-muted-foreground font-medium">Analyzing Base knowledge...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Quick Questions (only when few messages) */}
                {messages.length <= 2 && !loading && (
                    <div className="px-4 pb-3">
                        <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-[0.2em] mb-2 px-1">Quick Questions</p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_QUESTIONS.slice(0, 6).map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(item.q)}
                                    className="px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/15 text-[11px] font-bold text-foreground/80 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 transition-all"
                                >
                                    {item.emoji} {item.q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="px-4 pb-4 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-3">
                        <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                            isDarkMode
                                ? "bg-slate-800/50 border-slate-700/50 focus-within:border-blue-500/50 focus-within:bg-slate-800"
                                : "bg-slate-50 border-slate-200 focus-within:border-blue-500/50 focus-within:bg-white"
                        } focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]`}>
                            <Sparkles className="w-4 h-4 text-blue-500/50 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKey}
                                disabled={loading}
                                placeholder="Ask about Base chain..."
                                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || loading}
                            className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:shadow-none"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-[8px] font-bold text-muted-foreground/50 mt-2 uppercase tracking-widest">
                        Base Chain AI • Powered by Gemini
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export default BaseAIAssistant;
