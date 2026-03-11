"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Volume2, VolumeX, Loader2, Sparkles,
    X, Mic, MicOff, Paperclip, FileText, Code2, Copy, Check, ChevronDown
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    file?: { name: string; type: string; preview?: string };
}

interface AttachedFile {
    name: string;
    type: string;
    preview?: string;
    base64?: string;
}

interface AIAssistantProps {
    isDarkMode: boolean;
    onClose?: () => void;
}

// ════════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTER  (zero deps)
// ════════════════════════════════════════════════════════════════

function escapeHtml(s: string) {
    if (!s) return '';
    return s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightCode(raw: string, lang: string): string {
    let c = escapeHtml(raw);

    if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) {
        c = c
            .replace(/(\/\/[^\n]*)/g, '<s class="hc">$1</s>')
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<s class="hc">$1</s>')
            .replace(/(&quot;.*?&quot;|&#x27;.*?&#x27;|`[^`]*`)/g, '<s class="hs">$1</s>')
            .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|new|this|typeof|instanceof|async|await|try|catch|finally|throw|import|export|default|from|of|in|extends|super|yield|delete|void|null|undefined|true|false|NaN|Infinity)\b/g,
                '<s class="hk">$1</s>')
            .replace(/\b(-?\d+\.?\d*)\b/g, '<s class="hn">$1</s>')
            .replace(/\b([A-Za-z_$][A-Za-z0-9_$]*)(?=\s*\()/g, '<s class="hf">$1</s>')
            .replace(/([=!<>+\-*/%&|^~?:]+)/g, '<s class="ho">$1</s>');
    } else if (['css', 'scss'].includes(lang)) {
        c = c
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<s class="hc">$1</s>')
            .replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g, '<s class="hn">$1</s>')
            .replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;)/g, '<s class="hs">$1</s>')
            .replace(/([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)(?=\s*\{)/g, '<s class="hf">$1</s>')
            .replace(/\b([a-zA-Z-]+)(?=\s*:)/g, '<s class="hk">$1</s>');
    } else if (['html', 'xml'].includes(lang)) {
        c = c
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<s class="hc">$1</s>')
            .replace(/(&lt;\/?)([\w-]+)/g, '$1<s class="hk">$2</s>')
            .replace(/([\w-]+)(?=\s*=)/g, '<s class="hf">$1</s>')
            .replace(/(&quot;[^&]*&quot;)/g, '<s class="hs">$1</s>');
    } else if (lang === 'json') {
        c = c
            .replace(/(&quot;[^&]*&quot;)\s*:/g, '<s class="hk">$1</s>:')
            .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <s class="hs">$1</s>')
            .replace(/\b(true|false|null)\b/g, '<s class="hn">$1</s>')
            .replace(/\b(-?\d+\.?\d*)\b/g, '<s class="hn">$1</s>');
    }
    return c;
}

// ════════════════════════════════════════════════════════════════
//  CODE BLOCK
// ════════════════════════════════════════════════════════════════

function CodeBlock({ code, lang }: { code: string; lang: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <div className="my-3 rounded-2xl overflow-hidden border border-slate-700 bg-[#0d1117] text-left">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-700/80">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <Code2 className="w-3.5 h-3.5 text-slate-500 ml-1" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{lang || 'code'}</span>
                </div>
                <button onClick={copy}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-700/60 active:scale-95">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</>
                        : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </button>
            </div>
            <div className="overflow-x-auto p-4">
                <pre className="text-[13px] leading-relaxed font-mono m-0">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(code, lang) }} />
                </pre>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
//  MESSAGE PARSER  (text ↔ code blocks)
// ════════════════════════════════════════════════════════════════

type Part = { type: 'text'; content: string } | { type: 'code'; content: string; lang: string };

function parseMessage(text: string): Part[] {
    const parts: Part[] = [];
    const re = /```(\w*)\n?([\s\S]*?)```/g;
    let cursor = 0, m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > cursor) parts.push({ type: 'text', content: text.slice(cursor, m.index) });
        parts.push({ type: 'code', lang: m[1] || 'javascript', content: m[2].trim() });
        cursor = m.index + m[0].length;
    }
    if (cursor < text.length) parts.push({ type: 'text', content: text.slice(cursor) });
    return parts;
}

function renderInline(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
        seg.startsWith('**') && seg.endsWith('**')
            ? <strong key={i} className="font-bold">{seg.slice(2, -2)}</strong>
            : <span key={i}>{seg}</span>
    );
}

function MessageContent({ content, isDark }: { content: string; isDark: boolean }) {
    // ── Strip URDU_VOICE tag from display ──
    const displayContent = content.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, '').trim();
    const parts = parseMessage(displayContent);
    return (
        <div>
            {parts.map((p, i) =>
                p.type === 'code'
                    ? <CodeBlock key={i} code={p.content} lang={p.lang} />
                    : <p key={i} className={`leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px] ${i > 0 ? 'mt-2' : ''}`}>
                        {renderInline(p.content)}
                    </p>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
//  FILE BADGE
// ════════════════════════════════════════════════════════════════

function FileBadge({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
    const isImg = file.type.startsWith('image/');
    return (
        <motion.div initial={{ opacity: 0, y: 6, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .9 }}
            className="flex items-center gap-2.5 bg-violet-500/10 border border-violet-400/25 rounded-xl px-3 py-2 mb-2.5 w-fit max-w-full">
            {isImg && file.preview
                ? <img src={file.preview} className="w-9 h-9 rounded-lg object-cover border border-violet-400/20" alt="" />
                : <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-violet-400" />
                </div>}
            <div className="min-w-0">
                <p className="text-xs font-bold text-violet-300 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-violet-400/60 font-medium">{isImg ? 'Image' : 'File'} • Ready to send</p>
            </div>
            <button onClick={onRemove}
                className="w-5 h-5 ml-1 rounded-full bg-violet-400/20 flex items-center justify-center hover:bg-red-500/70 hover:text-white text-violet-300 transition-all shrink-0">
                <X className="w-3 h-3" />
            </button>
        </motion.div>
    );
}

// ════════════════════════════════════════════════════════════════
//  PULSE DOT
// ════════════════════════════════════════════════════════════════

function PulseDot({ color }: { color: string }) {
    return (
        <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
        </span>
    );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export const AIAssistant = ({ isDarkMode, onClose }: AIAssistantProps) => {

    const [messages, setMessages] = useState<Message[]>([{
        id: '1', role: 'assistant',
        content: `Hello! 👋 I am your **AI JavaScript Mentor**.\n\nI'm here to help you master JavaScript. You can ask me anything about JS:\n\n- 📌 I'll explain in simple English\n- 💻 Provided with working code examples\n- 📎 I can also analyze your files and images\n- 🎙️ You can even talk to me using your microphone\n\nLet's get started! 🚀 [[URDU_VOICE: Salam! Main aapka AI JavaScript mentor hoon. Aap mujhse JS ke baare mein kuch bhi pooch sakte hain. Shuru karte hain!]]`
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [micAvailable, setMicAvailable] = useState(false);
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [preferredLang, setPreferredLang] = useState<'ur-PK' | 'en-US'>('ur-PK');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Scroll ────────────────────────────────────────────────
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

    useEffect(() => {
        const el = chatAreaRef.current;
        if (!el) return;
        const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
        el.addEventListener('scroll', fn);
        return () => el.removeEventListener('scroll', fn);
    }, []);

    // ── Speech Synthesis ──────────────────────────────────────
    const stopSpeaking = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            // Optional: reset the queue on some browsers
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        } catch (e) { console.error('Speech stop error:', e); }
        setIsSpeaking(false);
    }, []);

    const speak = useCallback((text: string) => {
        if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

        // ── Detect and extract URDU_VOICE tag ──
        const voiceMatch = text.match(/\[\[URDU_VOICE:\s*([\s\S]*?)\s*\]\]/);
        let textToSpeak = voiceMatch ? voiceMatch[1] : text;

        // Strip tags for speech
        const clean = textToSpeak
            .replace(/```[\s\S]*?```/g, ' Code block. ')
            .replace(/[*_`#]/g, '')
            .replace(/\n+/g, ' ')
            .trim()
            .slice(0, 500);

        stopSpeaking();

        // 1s delay to ensure previous utterance is fully cleared
        setTimeout(() => {
            const utt = new SpeechSynthesisUtterance(clean);

            // Detection: check Arabic script or common Roman Urdu markers
            const urduTokens = ['salam', 'kar', 'karo', 'theek', 'kya', 'kaise', 'bilkul', 'mein', 'hoon', 'aap', 'bhi', 'hai', 'nahi', 'shuru', 'hain', 'ji', 'shabash'];
            const isUrdu = /[\u0600-\u06FF]/.test(clean) ||
                preferredLang === 'ur-PK' ||
                urduTokens.filter(w => clean.toLowerCase().split(/\W+/).includes(w)).length >= 1;

            // Voice Priority: Urdu > Hindi (closest phonetic) > English
            const doSpeak = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    let bestVoice = null;
                    if (isUrdu) {
                        // Priority 1: Urdu (ur-PK, ur-IN)
                        bestVoice = voices.find(v => v.lang.startsWith('ur') && /Google|Natural|Premium|Enhanced/.test(v.name))
                            || voices.find(v => v.lang.startsWith('ur'));

                        // Priority 2: Hindi (hi-IN) - very similar phonetics for Roman Urdu
                        if (!bestVoice) {
                            bestVoice = voices.find(v => v.lang.startsWith('hi') && /Google|Natural|Premium|Enhanced/.test(v.name))
                                || voices.find(v => v.lang.startsWith('hi'));
                        }

                        utt.lang = bestVoice ? bestVoice.lang : 'hi-IN';
                        utt.rate = 0.92; // Slightly slower for better clarity in Urdu/Hindi
                        utt.pitch = 1.0;
                    } else {
                        bestVoice = voices.find(v => v.lang.startsWith('en') && /Google|Natural|Premium|Enhanced/.test(v.name))
                            || voices.find(v => v.lang.startsWith('en'));
                        utt.lang = 'en-US';
                        utt.rate = 1.0;
                        utt.pitch = 1.0;
                    }

                    if (bestVoice) utt.voice = bestVoice;
                }

                utt.onstart = () => setIsSpeaking(true);
                utt.onend = () => setIsSpeaking(false);
                utt.onerror = (e) => {
                    console.error('Speech synthesis internal error:', e);
                    setIsSpeaking(false);
                };

                window.speechSynthesis.speak(utt);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                doSpeak();
            } else {
                // Handle async voice loading on some mobile browsers
                window.speechSynthesis.onvoiceschanged = () => {
                    doSpeak();
                    window.speechSynthesis.onvoiceschanged = null;
                };
                // Fallback timeout
                setTimeout(doSpeak, 250);
            }
        }, 50);
    }, [voiceEnabled, stopSpeaking, preferredLang]);

    // ── Mic setup ────────────────────────────────────────────
    useEffect(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setMicAvailable(!!SR);
        return () => stopSpeaking();
    }, [stopSpeaking]);

    const toggleListening = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { alert('Aapka browser mic support nahi karta. Chrome ya Edge use karein.'); return; }

        const safe = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'https:';
        if (!safe) { alert('⚠️ Mic sirf HTTPS ya Localhost pe kaam karta hai.'); return; }

        if (isListening) {
            try { recognition?.stop(); } catch { }
            setIsListening(false);
            return;
        }

        stopSpeaking();
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;

        // Language setup with fallback
        const primaryLang = preferredLang === 'ur-PK' ? 'ur-PK' : 'en-US';
        const fallbackLang = preferredLang === 'ur-PK' ? 'hi-IN' : 'en-GB';

        rec.lang = primaryLang;

        rec.onstart = () => {
            setIsListening(true);
            console.log('Mic started with lang:', rec.lang);
        };

        rec.onresult = (e: any) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
                if (inputRef.current) inputRef.current.focus();
            }
        };

        rec.onerror = (e: any) => {
            console.error('Mic Error:', e.error);
            if (e.error === 'language-not-supported' && rec.lang !== fallbackLang) {
                console.warn('Primary lang not supported, trying fallback:', fallbackLang);
                rec.lang = fallbackLang;
                try { rec.start(); return; } catch (err) { }
            }

            if (e.error === 'not-allowed') {
                alert('⚠️ Mic blocked. Browser settings (lock icon) mein Mic allow karein.');
            } else if (e.error === 'network') {
                alert('⚠️ Internet connection ya API key issue.');
            } else if (e.error === 'no-speech') {
                // Ignore silent errors
            } else {
                alert(`Mic Error: ${e.error}. Try switching language (URDU/ENG).`);
            }
            setIsListening(false);
        };

        rec.onend = () => {
            setIsListening(false);
            console.log('Mic session ended');
        };

        try {
            rec.start();
            setRecognition(rec);
        } catch (err) {
            console.error('Rec Start Error:', err);
            setIsListening(false);
        }
    };

    // ── File ─────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        if (f.size > 5 * 1024 * 1024) { alert('File max 5MB honi chahiye.'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target?.result as string;
            setAttachedFile({
                name: f.name, type: f.type,
                preview: f.type.startsWith('image/') ? dataUrl : undefined,
                base64: dataUrl.split(',')[1]
            });
        };
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    // ── Send ─────────────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() && !attachedFile) return;
        if (voiceEnabled && window.speechSynthesis) {
            try { const p = new SpeechSynthesisUtterance(''); p.volume = 0; window.speechSynthesis.speak(p); } catch { }
        }
        const snap = attachedFile;
        const userMsg: Message = {
            id: Date.now().toString(), role: 'user',
            content: input.trim() || `[File: ${snap?.name}]`,
            file: snap ? { name: snap.name, type: snap.type, preview: snap.preview } : undefined
        };
        setMessages(p => [...p, userMsg]);
        setInput(''); setAttachedFile(null); setIsLoading(true);
        try {
            const body: Record<string, unknown> = {
                message: userMsg.content,
                history: messages.map(m => ({ role: m.role, content: m.content }))
            };
            if (snap?.base64) body.file = { name: snap.name, type: snap.type, base64: snap.base64 };
            const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            const reply = data.message || 'Jawab nahi mila. Dobara try karein.';
            setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
            if (voiceEnabled) speak(reply);
        } catch {
            const err = '⚠️ Internet check karein ya page refresh karein.';
            setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: err }]);
            if (voiceEnabled) speak(err);
        } finally { setIsLoading(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const statusText = isSpeaking ? '🔊 Bol raha hoon…'
        : isListening ? (preferredLang === 'ur-PK' ? '🎙️ Urdu sun raha hoon…' : '🎙️ Listening English…')
            : isLoading ? '⏳ Soch raha hoon…'
                : `✅ Online • ${preferredLang === 'ur-PK' ? 'Urdu Voice Mode' : 'English Voice Mode'}`;

    // ════════════════════════════════════════════════════════
    //  RENDER
    // ════════════════════════════════════════════════════════
    return (
        <>
            <style>{`
                s{text-decoration:none}
                .hk{color:#c792ea;font-weight:600}
                .hs{color:#c3e88d}
                .hn{color:#f78c6c}
                .hc{color:#546e7a;font-style:italic}
                .hf{color:#82aaff}
                .ho{color:#89ddff}
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={`max-w-3xl mx-auto w-full rounded-2xl sm:rounded-[2rem] overflow-hidden flex flex-col h-[90vh] sm:h-[82vh] min-h-[500px] border shadow-2xl
                    ${isDarkMode ? 'border-slate-700/50 bg-slate-900 shadow-black/50' : 'border-slate-200 bg-white shadow-slate-300/60'}`}
            >

                {/* ═══ HEADER ═══ */}
                <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0
                    ${isDarkMode ? 'border-slate-800 bg-slate-800/70' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-400" />
                        </div>
                        <div>
                            <h2 className={`font-extrabold text-base flex items-center gap-1.5 leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                JS Mentor <Sparkles className="w-4 h-4 text-violet-500" />
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <PulseDot color={isSpeaking ? 'bg-violet-500' : 'bg-emerald-400'} />
                                <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{statusText}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <button onClick={() => setPreferredLang(l => l === 'ur-PK' ? 'en-US' : 'ur-PK')}
                            title={preferredLang === 'ur-PK' ? 'Urdu Voice (Preferred)' : 'English Voice (Preferred)'}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all border flex items-center gap-1
                                ${preferredLang === 'ur-PK'
                                    ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                                    : isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${preferredLang === 'ur-PK' ? 'bg-violet-400' : 'bg-slate-400'}`} />
                            {preferredLang === 'ur-PK' ? 'URDU VOICE' : 'ENG VOICE'}
                        </button>

                        <button onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                            title={voiceEnabled ? 'Awaaz band' : 'Awaaz on'}
                            className={`p-2.5 rounded-xl transition-all ${voiceEnabled ? 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/25' : isDarkMode ? 'bg-slate-700 text-slate-500 hover:bg-slate-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                            {voiceEnabled ? <Volume2 style={{ width: 18, height: 18 }} /> : <VolumeX style={{ width: 18, height: 18 }} />}
                        </button>
                        {onClose && (
                            <button onClick={onClose}
                                className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:bg-slate-700 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}>
                                <X style={{ width: 18, height: 18 }} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══ MESSAGES ═══ */}
                <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 scroll-smooth">
                    <AnimatePresence initial={false}>

                        {messages.map(msg => (
                            <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 14, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* avatar */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow
                                        ${msg.role === 'user' ? 'bg-gradient-to-br from-slate-600 to-slate-900 text-white' : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-500/20'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    {/* bubble */}
                                    <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-violet-500/20'
                                            : isDarkMode ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                                                : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'}`}>
                                        {msg.file && (
                                            <div className="mb-2.5 flex items-center gap-2 bg-black/15 rounded-xl px-3 py-2">
                                                {msg.file.preview
                                                    ? <img src={msg.file.preview} className="w-10 h-10 rounded-lg object-cover" alt="" />
                                                    : <FileText className="w-5 h-5 opacity-70" />}
                                                <span className="text-xs font-semibold opacity-80 truncate max-w-[180px]">{msg.file.name}</span>
                                            </div>
                                        )}
                                        {msg.role === 'assistant'
                                            ? <MessageContent content={msg.content} isDark={isDarkMode} />
                                            : <p className="leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap">{msg.content}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* typing dots */}
                        {isLoading && (
                            <motion.div key="loading" initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .9 }} className="flex justify-start">
                                <div className="flex gap-2.5 max-w-[90%]">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-3
                                        ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                        {[0, 1, 2].map(i => (
                                            <motion.span key={i} className="w-2.5 h-2.5 rounded-full bg-violet-500"
                                                animate={{ y: ['0%', '-55%', '0%'] }}
                                                transition={{ duration: .55, repeat: Infinity, delay: i * .14, ease: 'easeInOut' }} />
                                        ))}
                                        <span className={`text-sm font-medium ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Soch raha hoon…</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />

                    {/* scroll pill */}
                    <AnimatePresence>
                        {showScrollBtn && (
                            <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                                onClick={() => scrollToBottom()}
                                className="sticky bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-violet-500/30 transition-colors active:scale-95">
                                <ChevronDown className="w-3.5 h-3.5" /> Neeche jao
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* ═══ INPUT ═══ */}
                <div className={`px-4 sm:px-5 pt-3 pb-4 border-t shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/90'}`}>

                    <AnimatePresence>
                        {attachedFile && <FileBadge file={attachedFile} onRemove={() => setAttachedFile(null)} />}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isListening && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2 mb-2 text-xs font-bold text-red-400">
                                <PulseDot color="bg-red-500" />
                                Sun raha hoon… (bolo ya mic button dobara dabao)
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                        {/* field */}
                        <div className={`flex-1 flex items-center gap-1 rounded-2xl border px-3 transition-all
                            ${isDarkMode ? 'bg-slate-900/80 border-slate-700 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/20'
                                : 'bg-white border-slate-200 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/10'}`}>

                            {/* paperclip */}
                            <button onClick={() => fileInputRef.current?.click()} title="File attach karein"
                                className={`p-2 rounded-xl transition-all shrink-0 ${isDarkMode ? 'text-slate-500 hover:text-violet-400 hover:bg-slate-800' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'}`}>
                                <Paperclip style={{ width: 17, height: 17 }} />
                            </button>

                            {/* text */}
                            <input ref={inputRef} type="text" value={input}
                                onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                placeholder={
                                    isListening
                                        ? (preferredLang === 'ur-PK' ? '🎙️ Urdu mein bolein…' : '🎙️ Speaking English…')
                                        : (preferredLang === 'ur-PK' ? 'Urdu/English mein sawal poochein…' : 'Ask JS question in English…')
                                }
                                disabled={isLoading}
                                className={`flex-1 py-3.5 bg-transparent outline-none text-sm font-medium placeholder:font-normal min-w-0
                                    ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} />

                            {/* mic */}
                            {micAvailable && (
                                <button onClick={toggleListening} title={isListening ? 'Sunna band karo' : 'Mic se bolo'}
                                    className={`p-2 rounded-xl transition-all shrink-0
                                        ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                                            : isDarkMode ? 'text-slate-500 hover:text-violet-400 hover:bg-slate-800' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'}`}>
                                    {isListening ? <MicOff style={{ width: 17, height: 17 }} /> : <Mic style={{ width: 17, height: 17 }} />}
                                </button>
                            )}
                        </div>

                        {/* send */}
                        <button onClick={handleSend} disabled={(!input.trim() && !attachedFile) || isLoading}
                            className={`p-3.5 rounded-2xl transition-all shrink-0 shadow-lg active:scale-95
                                ${(!input.trim() && !attachedFile) || isLoading
                                    ? isDarkMode ? 'bg-slate-700 text-slate-600' : 'bg-slate-100 text-slate-300'
                                    : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700 shadow-violet-500/30'}`}>
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>

                    <p className={`text-center text-[10px] font-semibold uppercase tracking-widest mt-2.5 select-none
                        ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>
                        {voiceEnabled ? '🔊 Awaaz on' : '🔇 Awaaz off'}
                        {' • '}Enter se bhejo{' • '}📎 File attach{micAvailable ? ` • 🎙️ Mic (${preferredLang === 'ur-PK' ? 'Urdu' : 'Eng'})` : ''}
                    </p>
                </div>

                <input ref={fileInputRef} type="file" className="hidden"
                    accept="image/*,.pdf,.txt,.js,.ts,.jsx,.tsx,.json,.html,.css,.md,.py"
                    onChange={handleFileChange} />
            </motion.div >
        </>
    );
};

export default AIAssistant;
