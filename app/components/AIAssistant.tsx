"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Volume2, VolumeX, Loader2, Sparkles, MessageSquare, X, Mic, MicOff } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface AIAssistantProps {
    isDarkMode: boolean;
    onClose?: () => void;
}

export const AIAssistant = ({ isDarkMode, onClose }: AIAssistantProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hello! I'm your AI JavaScript Mentor. Ask me any question about JS, and I'll explain it to you!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const stopSpeaking = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (typeof window !== 'undefined' && SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) setInput(transcript);
                setIsListening(false);
            };

            rec.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert("Microphone access is blocked. Please click the icon in your address bar and ALLOW the microphone to talk to the AI!");
                }
                setIsListening(false);
            };

            rec.onend = () => setIsListening(false);
            setRecognition(rec);
        }
        return () => stopSpeaking();
    }, []);

    const speak = (text: string) => {
        if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

        stopSpeaking();
        const utterance = new SpeechSynthesisUtterance(text);

        const commonRoman = ['hai', 'kar', 'karo', 'shabash', 'theek', 'kya', 'kaise', 'bilkul', 'mera', 'hum', 'mein', 'tu', 'si', 'ho', 'well done'];
        const isUrduHindi = /[\u0600-\u06FF\u0900-\u097F]/.test(text) ||
            commonRoman.some(word => text.toLowerCase().includes(' ' + word + ' ') || text.toLowerCase().startsWith(word + ' '));

        utterance.lang = isUrduHindi ? 'hi-IN' : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();

            // Priority selection if voices are available
            if (voices.length > 0) {
                const preferredVoice = voices.find(v =>
                    v.lang.startsWith(isUrduHindi ? 'hi' : 'en') && (
                        v.name.includes('Google') ||
                        v.name.includes('Neural') ||
                        v.name.includes('Natural') ||
                        v.name.includes('Premium') ||
                        v.name.includes('Enhanced')
                    )
                ) || voices.find(v => v.lang.startsWith(isUrduHindi ? 'hi' : 'en'));

                if (preferredVoice) utterance.voice = preferredVoice;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error("Utterance error:", e);
                setIsSpeaking(false);
            };

            // Always speak even if voices aren't perfectly matched
            window.speechSynthesis.speak(utterance);
        };

        // Try speaking immediately
        setVoiceAndSpeak();
    };

    const toggleListening = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        // 🚨 SECURITY CHECK: Browsers block Mic on IP addresses. Only 'localhost' or 'https' works.
        if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
            alert("SECURITY BLOCK: Voice features only work on 'http://localhost:3000' or 'https'. Browsers block microphone on IP addresses for security. Please use 'localhost' in your URL bar.");
            return;
        }

        if (isListening) {
            try {
                recognition.stop();
            } catch (e) {
                console.error("Stop error:", e);
                setIsListening(false);
            }
        } else {
            stopSpeaking();
            try {
                recognition.lang = 'ur-PK';
                recognition.start();
                setIsListening(true);
            } catch (e: any) {
                console.error("Start error:", e);
                if (e.error === 'not-allowed') {
                    alert("MICROPHONE BLOCKED: Please click the 'Lock' icon next to the URL and set Microphone to 'Allow'.");
                }
                setIsListening(false);
            }
        }
    };



    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });
            const data = await res.json();

            const aiResponseText = data.message || "Something went wrong processing your request.";
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponseText };

            setMessages(prev => [...prev, aiMsg]);
            if (voiceEnabled) speak(aiResponseText);
        } catch (error) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I'm having trouble connecting right now." };
            setMessages(prev => [...prev, errorMsg]);
            if (voiceEnabled) speak("Sorry, I'm having trouble connecting right now.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-3xl mx-auto w-full glass-card rounded-2xl sm:rounded-[2.5rem] overflow-hidden flex flex-col items-stretch h-[75vh] min-h-[500px] border-2 shadow-2xl ${isDarkMode ? 'border-primary/20 bg-background/50' : 'border-primary/20 bg-white/50'}`}
        >
            {/* Header */}
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-border/50 bg-slate-900/50' : 'border-border/50 bg-slate-50/50'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-premium flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-black text-lg text-foreground flex items-center gap-2">
                            AI Mentor <Sparkles className="w-4 h-4 text-primary" />
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSpeaking ? 'bg-primary' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpeaking ? 'bg-primary' : 'bg-emerald-500'}`}></span>
                            </span>
                            {isSpeaking ? 'Speaking...' : 'Online & Ready'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setVoiceEnabled(!voiceEnabled);
                            if (isSpeaking) stopSpeaking();
                        }}
                        className={`p-2.5 rounded-xl transition-all ${voiceEnabled ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
                    >
                        {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                            title="Close Chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-premium text-white shadow-lg'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                <div className={`p-4 rounded-2xl text-sm sm:text-base ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-sm'
                                    : isDarkMode
                                        ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                                        : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'
                                    }`}
                                >
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-gradient-premium text-white flex items-center justify-center shrink-0 shadow-lg">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className={`p-4 rounded-2xl rounded-tl-sm flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground animate-pulse">Generating response...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-4 sm:p-6 border-t ${isDarkMode ? 'border-border/50 bg-slate-900/30' : 'border-border/50 bg-slate-50/50'}`}>
                <div className="relative flex items-center">
                    <div className="absolute left-4 text-muted-foreground">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : (recognition === null ? "Mic Blocked (Allow in Address Bar)" : "Ask in any language (Urdu/English)...")}
                        className={`w-full pl-12 pr-28 py-4 rounded-xl font-medium outline-none transition-all ${isDarkMode ? 'bg-slate-900/50 focus:bg-slate-900 text-white placeholder-slate-500 border border-slate-800 focus:border-primary/50' : 'bg-white focus:bg-white text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/5'}`}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        <button
                            onClick={toggleListening}
                            className={`p-2.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-muted-foreground hover:bg-slate-100 hover:text-primary'}`}
                            title="Voice Typing"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={`p-2.5 rounded-lg transition-all ${!input.trim() || isLoading ? 'bg-transparent text-muted-foreground' : 'bg-primary text-white shadow-md hover:bg-primary/90'}`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {voiceEnabled ? "🎙️ Voice enabled • Human readable" : "🔇 Voice disabled • Text mode"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
