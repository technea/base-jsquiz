"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Volume2, VolumeX, Loader2, Sparkles,
    X, Mic, MicOff, Paperclip, FileText, Code2, Copy, Check, 
    ChevronDown, Brain, BookOpen, HelpCircle, ArrowRight
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    file?: { name: string; type: string; preview?: string };
    type?: 'code_explanation' | 'quiz' | 'normal';
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

interface QuizOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface QuizQuestion {
    id: string;
    question: string;
    options: QuizOption[];
    explanation: string;
}

// ════════════════════════════════════════════════════════════════
//  SYNTAX HIGHLIGHTER
// ════════════════════════════════════════════════════════════════

function escapeHtml(s: string) {
    if (!s) return '';
    return s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function highlightCode(raw: string, lang: string): string {
    let c = escapeHtml(raw);

    if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) {
        c = c
            .replace(/(\/\/[^\n]*)/g, '<span class="hljs-comment">$1</span>')
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hljs-comment">$1</span>')
            .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`[^`]*`)/g, '<span class="hljs-string">$1</span>')
            .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|new|this|typeof|instanceof|async|await|try|catch|finally|throw|import|export|default|from|of|in|extends|super)\b/g,
                '<span class="hljs-keyword">$1</span>')
            .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="hljs-number">$1</span>')
            .replace(/\b([A-Za-z_$][A-Za-z0-9_$]*)(?=\s*\()/g, '<span class="hljs-function">$1</span>')
            .replace(/([=!<>+\-*/%&|^~?:]+)/g, '<span class="hljs-operator">$1</span>');
    }
    return c;
}

// ════════════════════════════════════════════════════════════════
//  CODE BLOCK WITH LINE NUMBERS
// ════════════════════════════════════════════════════════════════

function CodeBlock({ code, lang, showLineNumbers = true }: { code: string; lang: string; showLineNumbers?: boolean }) {
    const [copied, setCopied] = useState(false);
    const lines = code.split('\n');
    
    const copy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="my-4 rounded-2xl overflow-hidden border border-border bg-[#0d1117] text-left shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <Code2 className="w-4 h-4 text-slate-500 ml-2" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang || 'code'}</span>
                </div>
                <button onClick={copy}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white transition-all px-3 py-1.5 rounded-lg hover:bg-white/5 active:scale-95">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</>
                        : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                {showLineNumbers && (
                                    <td className="text-right text-slate-600 text-[10px] select-none px-3 py-0.5 border-r border-white/5 w-10">
                                        {index + 1}
                                    </td>
                                )}
                                <td className="px-4 py-0.5">
                                    <pre className="text-[13px] leading-relaxed font-mono m-0">
                                        <code dangerouslySetInnerHTML={{ 
                                            __html: line ? highlightCode(line, lang) : '<br/>' 
                                        }} />
                                    </pre>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
//  QUIZ COMPONENT
// ════════════════════════════════════════════════════════════════

function QuizComponent({ questions, onComplete }: { questions: QuizQuestion[], onComplete?: (score: number) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);

    const currentQuestion = questions[currentIndex];
    
    const handleOptionSelect = (optionId: string, isCorrect: boolean) => {
        if (answered) return;
        
        setSelectedOption(optionId);
        setAnswered(true);
        setShowExplanation(true);
        
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
            setAnswered(false);
        } else {
            onComplete?.(score);
        }
    };

    return (
        <div className="my-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Brain className="w-24 h-24" />
            </div>

            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1">Knowledge Check</p>
                    <p className="text-sm font-extrabold text-foreground">Question {currentIndex + 1} of {questions.length}</p>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-muted-foreground uppercase">
                    Score: {score}
                </div>
            </div>
            
            <p className="text-lg font-bold text-foreground mb-6 leading-tight relative z-10">{currentQuestion.question}</p>
            
            <div className="space-y-2.5 mb-6 relative z-10">
                {currentQuestion.options.map(option => (
                    <motion.button
                        key={option.id}
                        whileHover={!answered ? { x: 4, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' } : {}}
                        whileTap={!answered ? { scale: 0.98 } : {}}
                        onClick={() => handleOptionSelect(option.id, option.isCorrect)}
                        disabled={answered}
                        className={`w-full text-left p-4 rounded-2xl text-sm font-semibold transition-all border-2
                            ${answered && option.isCorrect ? 'bg-success/5 border-success/30 text-success shadow-lg shadow-success/5' : ''}
                            ${answered && selectedOption === option.id && !option.isCorrect ? 'bg-error/5 border-error/30 text-error shadow-lg shadow-error/5' : ''}
                            ${!answered ? 'bg-background/40 border-border group-hover:border-primary/40' : ''}
                            ${selectedOption === option.id && !answered ? 'border-primary ring-4 ring-primary/10' : 'border-border/60'}
                            ${answered && selectedOption !== option.id && !option.isCorrect ? 'opacity-40 grayscale-[50%]' : ''}`}
                    >
                        {option.text}
                    </motion.button>
                ))}
            </div>
            
            <AnimatePresence>
                {showExplanation && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border text-xs leading-relaxed italic text-muted-foreground"
                    >
                        <span className="font-bold text-foreground not-italic block mb-1 uppercase tracking-widest text-[9px]">Deep Dive:</span>
                        {currentQuestion.explanation}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {answered && (
                <button
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl btn-premium text-sm font-bold shadow-xl flex items-center justify-center gap-2 group transition-all"
                >
                    {currentIndex < questions.length - 1 ? 'Next Challenge' : 'Finish Quiz'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
//  MESSAGE PARSER
// ════════════════════════════════════════════════════════════════

type Part = { type: 'text'; content: string } | { type: 'code'; content: string; lang: string } | { type: 'quiz'; questions: QuizQuestion[] };

function parseMessage(text: string): Part[] {
    const parts: Part[] = [];
    
    // Parse quiz format
    const quizRegex = /\[\[QUIZ:START\]\]([\s\S]*?)\[\[QUIZ:END\]\]/g;
    let quizMatch;
    let lastIndex = 0;
    
    while ((quizMatch = quizRegex.exec(text)) !== null) {
        // Add text before quiz
        if (quizMatch.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, quizMatch.index) });
        }
        
        // Parse quiz questions
        try {
            const quizData = JSON.parse(quizMatch[1]);
            if (Array.isArray(quizData) && quizData.length > 0) {
                parts.push({ type: 'quiz', questions: quizData });
            }
        } catch (e) {
            // If quiz parsing fails, treat as text
            parts.push({ type: 'text', content: quizMatch[0] });
        }
        
        lastIndex = quizMatch.index + quizMatch[0].length;
    }
    
    // Parse remaining text for code blocks
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
        let cursor = 0;
        let codeMatch;
        
        while ((codeMatch = codeRegex.exec(remainingText)) !== null) {
            if (codeMatch.index > cursor) {
                parts.push({ type: 'text', content: remainingText.slice(cursor, codeMatch.index) });
            }
            parts.push({ type: 'code', lang: codeMatch[1] || 'javascript', content: codeMatch[2].trim() });
            cursor = codeMatch.index + codeMatch[0].length;
        }
        
        if (cursor < remainingText.length) {
            parts.push({ type: 'text', content: remainingText.slice(cursor) });
        }
    }
    
    return parts;
}

function renderInline(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((seg, i) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
            return <strong key={i} className="font-bold">{seg.slice(2, -2)}</strong>;
        } else if (seg.startsWith('`') && seg.endsWith('`')) {
            return <code key={i} className="px-1.5 py-0.5 bg-slate-800 rounded-md text-violet-300 text-xs">{seg.slice(1, -1)}</code>;
        }
        return <span key={i}>{seg}</span>;
    });
}

function MessageContent({ content, isDark }: { content: string; isDark: boolean }) {
    const displayContent = content.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, '').trim();
    const parts = parseMessage(displayContent);
    
    return (
        <div>
            {parts.map((p, i) => {
                if (p.type === 'code') {
                    return <CodeBlock key={i} code={p.content} lang={p.lang} />;
                } else if (p.type === 'quiz') {
                    return <QuizComponent key={i} questions={p.questions} />;
                } else {
                    return (
                        <p key={i} className={`leading-relaxed whitespace-pre-wrap text-[15px] sm:text-[17px] font-medium ${i > 0 ? 'mt-3' : ''}`}>
                            {renderInline(p.content)}
                        </p>
                    );
                }
            })}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export const AIAssistant = ({ isDarkMode, onClose }: AIAssistantProps) => {
    const [messages, setMessages] = useState<Message[]>([{
        id: '1', 
        role: 'assistant',
        type: 'normal',
        content: `Hello! 👋 I am your **AI JavaScript Mentor** with advanced capabilities!

I can help you with:

📝 **Code Explanation**: Just paste any JavaScript code and I'll explain it line by line with voice
❓ **Quizzes**: Ask me to generate quizzes on any topic
🔊 **Voice Support**: Both English and Urdu voice explanations
📎 **File Analysis**: Upload code files for analysis

Try these commands:
• "Explain this code: [paste your code]"
• "Generate a quiz about JavaScript closures"
• "Create a 5-question quiz on React hooks"

Let's start learning! 🚀`
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
    const [preferredLang, setPreferredLang] = useState<'ur-PK' | 'en-US'>('en-US');
    const [quizMode, setQuizMode] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom
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

    // Speech Synthesis
    const stopSpeaking = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        } catch (e) { console.error('Speech stop error:', e); }
        setIsSpeaking(false);
    }, []);

    const speak = useCallback((text: string) => {
        if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

        stopSpeaking();

        const englishPart = text.replace(/\[\[URDU_VOICE:[\s\S]*?\]\]/g, '').trim();
        const urduMatch = text.match(/\[\[URDU_VOICE:\s*([\s\S]*?)\s*\]\]/);
        const urduPart = urduMatch ? urduMatch[1].trim() : '';

        const cleanEnglish = englishPart
            .replace(/```[\s\S]*?```/g, ' Code block. ')
            .replace(/[*_`#]/g, '')
            .replace(/\n+/g, ' ')
            .slice(0, 500);

        const cleanUrdu = urduPart
            .replace(/[*_`#]/g, '')
            .replace(/\n+/g, ' ')
            .slice(0, 500);

        const playUtterance = (cleanText: string, lang: 'en' | 'ur') => {
            return new Promise<void>((resolve) => {
                const utt = new SpeechSynthesisUtterance(cleanText);
                const voices = window.speechSynthesis.getVoices();

                if (lang === 'en') {
                    // Prioritize clear English voices
                    const v = voices.find(v => v.lang.startsWith('en') && /Google|Natural|Enhanced|Neural|Premium/.test(v.name)) 
                           || voices.find(v => v.lang.startsWith('en-US')) 
                           || voices.find(v => v.lang.startsWith('en'));
                    if (v) utt.voice = v;
                    utt.lang = 'en-US';
                    utt.rate = 1.05; // Slightly faster for clarity
                    utt.pitch = 1.0;
                } else {
                    const v = voices.find(v => v.lang.startsWith('ur')) || voices.find(v => v.lang.startsWith('hi'));
                    if (v) utt.voice = v;
                    utt.lang = v ? v.lang : 'hi-IN';
                    utt.rate = 0.95;
                    utt.pitch = 1.0;
                }

                utt.onstart = () => setIsSpeaking(true);
                utt.onend = () => { resolve(); };
                utt.onerror = () => { resolve(); };
                window.speechSynthesis.speak(utt);
            });
        };

        const runSpeech = async () => {
            if (cleanEnglish) await playUtterance(cleanEnglish, 'en');
            if (cleanUrdu) await playUtterance(cleanUrdu, 'ur');
            setIsSpeaking(false);
        };

        setTimeout(runSpeech, 100);
    }, [voiceEnabled, stopSpeaking]);

    // Mic setup
    useEffect(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setMicAvailable(!!SR);
        return () => stopSpeaking();
    }, [stopSpeaking]);

    const toggleListening = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { 
            alert('Your browser does not support microphone input. Please use Chrome or Edge.'); 
            return;
        }

        const safe = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'https:';
        if (!safe) { 
            alert('⚠️ Microphone only works on HTTPS or Localhost.'); 
            return;
        }

        if (isListening) {
            try { recognition?.stop(); } catch { }
            setIsListening(false);
            return;
        }

        stopSpeaking();
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = true;

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
                alert('⚠️ Microphone blocked. Please allow microphone access in browser settings.');
            } else if (e.error === 'network') {
                alert('⚠️ Network issue or API key problem.');
            } else if (e.error === 'no-speech') {
                // Ignore silent errors
            } else {
                alert(`Microphone Error: ${e.error}. Try switching language.`);
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

    // File handling
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; 
        if (!f) return;
        
        if (f.size > 10 * 1024 * 1024) { 
            alert('File size must be under 10MB.'); 
            return; 
        }
        
        const reader = new FileReader();
        reader.onload = ev => {
            const dataUrl = ev.target?.result as string;
            setAttachedFile({
                name: f.name, 
                type: f.type,
                preview: f.type.startsWith('image/') ? dataUrl : undefined,
                base64: dataUrl.split(',')[1]
            });
        };
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    // Send message
    const handleSend = async () => {
        if (!input.trim() && !attachedFile) return;
        
        if (voiceEnabled && window.speechSynthesis) {
            try { 
                const p = new SpeechSynthesisUtterance(''); 
                p.volume = 0; 
                window.speechSynthesis.speak(p); 
            } catch { }
        }
        
        const snap = attachedFile;
        const userMsg: Message = {
            id: Date.now().toString(), 
            role: 'user',
            content: input.trim() || `[File: ${snap?.name}]`,
            file: snap ? { name: snap.name, type: snap.type, preview: snap.preview } : undefined
        };
        
        setMessages(p => [...p, userMsg]);
        setInput(''); 
        setAttachedFile(null); 
        setIsLoading(true);

        try {
            const body: Record<string, unknown> = {
                message: userMsg.content,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                language: preferredLang,
                mode: quizMode ? 'quiz' : 'normal'
            };
            
            if (snap?.base64) body.file = { name: snap.name, type: snap.type, base64: snap.base64 };
            
            const res = await fetch('/api/chat', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body) 
            });
            
            const data = await res.json();
            
            // Check if response contains quiz
            if (data.type === 'quiz' && data.questions) {
                const quizMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    type: 'quiz',
                    content: `[[QUIZ:START]]${JSON.stringify(data.questions)}[[QUIZ:END]]`
                };
                setMessages(p => [...p, quizMessage]);
            } else {
                const reply = data.message || (preferredLang === 'ur-PK' ? 'Jawab nahi mila. Dobara try karein.' : 'No response received. Please try again.');
                setMessages(p => [...p, { 
                    id: (Date.now() + 1).toString(), 
                    role: 'assistant', 
                    type: data.type || 'normal',
                    content: reply 
                }]);
                if (voiceEnabled) speak(reply);
            }
        } catch {
            const err = preferredLang === 'ur-PK' ? '⚠️ Internet check karein ya page refresh karein.' : '⚠️ Please check your internet or refresh the page.';
            setMessages(p => [...p, { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                type: 'normal',
                content: err 
            }]);
            if (voiceEnabled) speak(err);
        } finally { 
            setIsLoading(false); 
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        }
    };

    const statusText = isSpeaking ? '🔊 Speaking...'
        : isListening ? (preferredLang === 'ur-PK' ? '🎙️ Listening (Urdu)...' : '🎙️ Listening (English)...')
            : isLoading ? '⏳ Thinking...'
                : quizMode ? '📝 Quiz Mode • Generate questions'
                    : `✅ Online • ${preferredLang === 'ur-PK' ? 'Urdu Voice' : 'English Voice'}`;

    return (
        <>
            <style>{`
                .hljs-keyword { color: #c792ea; font-weight: 600; }
                .hljs-string { color: #c3e88d; }
                .hljs-number { color: #f78c6c; }
                .hljs-comment { color: #546e7a; font-style: italic; }
                .hljs-function { color: #82aaff; }
                .hljs-operator { color: #89ddff; }
            `}</style>

            <motion.div
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className={`max-w-3xl mx-auto w-full sm:rounded-[2.5rem] overflow-hidden flex flex-col h-[100dvh] sm:h-[85vh] min-h-0 sm:min-h-[600px] border shadow-2xl relative z-50
                    ${isDarkMode ? 'border-slate-800 bg-slate-900/90 backdrop-blur-xl' : 'border-slate-200 bg-white/95 backdrop-blur-xl shadow-slate-200/60'}`}
            >
                {/* Header Section */}
                <div className={`px-6 py-5 border-b flex items-center justify-between shrink-0 relative overflow-hidden
                    ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    
                    {/* Decorative Header Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="relative">
                            <motion.div 
                                animate={{ 
                                    y: [0, -3, 0],
                                }}
                                transition={{ 
                                    duration: 3, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10"
                            >
                                <Bot className="w-6 h-6 text-white" />
                            </motion.div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-background bg-success shadow-lg shadow-success/40" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight leading-none">
                                    AI Mentor <span className="text-primary italic">Pro</span>
                                </h2>
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[11px] font-bold tracking-widest uppercase opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {statusText}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setQuizMode(!quizMode)}
                            className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2
                                ${quizMode 
                                    ? 'bg-amber-500 text-white shadow-amber-500/20' 
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'}`}
                        >
                            <Brain className="w-4 h-4" />
                            {quizMode && <span className="text-[10px] font-bold uppercase tracking-widest hidden xs:inline">Quiz Mode</span>}
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                            className={`p-3 rounded-2xl transition-all ${voiceEnabled ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'}`}>
                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </motion.button>
                        
                        {onClose && (
                            <motion.button 
                                whileHover={{ scale: 1.05, rotate: 90 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                className="p-3 rounded-2xl bg-muted text-muted-foreground hover:text-foreground transition-all">
                                <X className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Messages Container */}
                <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth no-scrollbar">
                    <AnimatePresence initial={false}>
                        {messages.map(msg => (
                            <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 15 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-4 max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar/Icon Section */}
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg transition-transform hover:scale-110
                                        ${msg.role === 'user' 
                                            ? 'bg-slate-800 text-white' 
                                            : msg.type === 'quiz'
                                                ? 'bg-amber-500 text-white shadow-amber-500/20'
                                                : 'bg-primary text-white shadow-primary/20'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : 
                                         msg.type === 'quiz' ? <Brain className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>

                                    {/* Message Bubble */}
                                    <div className={`relative px-5 py-4 sm:px-6 sm:py-5 rounded-[1.75rem] shadow-sm tracking-tight
                                        ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-tr-sm'
                                            : isDarkMode 
                                                ? 'bg-slate-800/90 border border-slate-700/50 text-slate-100 rounded-tl-sm' 
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-slate-100/50'}`}>
                                        
                                        {msg.file && (
                                            <div className="mb-4 flex items-center gap-3 bg-black/10 rounded-2xl px-4 py-2 border border-white/5">
                                                {msg.file.preview
                                                    ? <img src={msg.file.preview} className="w-10 h-10 rounded-xl object-cover shadow-inner" alt="" />
                                                    : <FileText className="w-6 h-6 opacity-60" />}
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold opacity-90 truncate max-w-[150px]">{msg.file.name}</p>
                                                    <p className="text-[9px] font-medium opacity-50 uppercase tracking-widest">Document Attached</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {msg.role === 'assistant'
                                            ? <MessageContent content={msg.content} isDark={isDarkMode} />
                                            : <p className="leading-relaxed text-[15px] sm:text-[17px] font-semibold whitespace-pre-wrap">{msg.content}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing Animation */}
                        {isLoading && (
                            <motion.div key="loading" 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="flex justify-start">
                                <div className="flex gap-4 max-w-[90%]">
                                    <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className={`px-6 py-4 rounded-[1.75rem] rounded-tl-md flex items-center gap-3
                                        ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                                        {[0, 1, 2].map(i => (
                                            <motion.span key={i} 
                                                className="w-2.5 h-2.5 rounded-full bg-primary/40"
                                                animate={{ 
                                                    scale: [1, 1.5, 1],
                                                    backgroundColor: ['rgba(var(--primary-rgb), 0.4)', 'rgba(var(--primary-rgb), 1)', 'rgba(var(--primary-rgb), 0.4)'] 
                                                }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />

                    {/* Quick Jump Point */}
                    <AnimatePresence>
                        {showScrollBtn && (
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: 10 }}
                                onClick={() => scrollToBottom()}
                                className="sticky bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full shadow-2xl transition-all active:scale-95 group z-50">
                                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                <span className="text-[11px] font-extrabold uppercase tracking-widest">New Messages</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area Section */}
                <div className={`px-6 py-6 border-t shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                    
                    {/* Suggestion Chips */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setInput("Can you explain how async/await works under the hood?")}
                            className="px-4 py-2 text-[10px] font-bold rounded-xl bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap shadow-sm"
                        >
                            <Code2 className="w-3.5 h-3.5 inline mr-1.5" /> Explain Async/Await
                        </motion.button>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setQuizMode(true); setInput("Generate a hard quiz about JavaScript Prototypal Inheritance."); }}
                            className="px-4 py-2 text-[10px] font-bold rounded-xl bg-background border border-border text-muted-foreground hover:text-amber-500 hover:border-amber-500/30 transition-all whitespace-nowrap shadow-sm"
                        >
                            <Brain className="w-3.5 h-3.5 inline mr-1.5" /> Prototypal Quiz
                        </motion.button>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setInput("What are the best practices for React 18+ performance?")}
                            className="px-4 py-2 text-[10px] font-bold rounded-xl bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5 inline mr-1.5" /> Best Practices
                        </motion.button>
                    </div>

                    {/* Active File Preview */}
                    <AnimatePresence>
                        {attachedFile && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 mb-4 w-fit max-w-full">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    {attachedFile.preview
                                        ? <img src={attachedFile.preview} className="w-full h-full rounded-lg object-cover" alt="" />
                                        : <FileText className="w-5 h-5 text-primary" />}
                                </div>
                                <div className="min-w-0 pr-4">
                                    <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{attachedFile.name}</p>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Selected for analysis</p>
                                </div>
                                <button 
                                    onClick={() => setAttachedFile(null)}
                                    className="p-1.5 rounded-full hover:bg-error/10 text-muted-foreground hover:text-error transition-all shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Interactive Input Bar */}
                    <div className="flex items-end gap-3">
                        <div className={`flex-1 flex items-center gap-1 rounded-3xl border px-3 py-1.5 transition-all
                            ${isDarkMode ? 'bg-slate-800/80 border-slate-700/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
                                : 'bg-white border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 shadow-sm'}`}>

                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all shrink-0">
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <input 
                                ref={inputRef} 
                                type="text" 
                                value={input}
                                onChange={e => setInput(e.target.value)} 
                                onKeyDown={handleKeyDown}
                                placeholder={isListening ? 'Listening...' : quizMode ? 'What should we quiz on?' : 'Type your question...'}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-transparent outline-none text-[15px] font-medium placeholder:font-normal" />

                            {micAvailable && (
                                <button 
                                    onClick={toggleListening} 
                                    className={`p-2.5 rounded-xl transition-all shrink-0
                                        ${isListening ? 'bg-error text-white shadow-lg shadow-error/20 animate-pulse'
                                            : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            )}
                        </div>

                        <motion.button 
                            whileHover={(!input.trim() && !attachedFile) || isLoading ? {} : { scale: 1.05 }}
                            whileTap={(!input.trim() && !attachedFile) || isLoading ? {} : { scale: 0.95 }}
                            onClick={handleSend} 
                            disabled={(!input.trim() && !attachedFile) || isLoading}
                            className={`w-14 h-14 rounded-3xl transition-all shrink-0 shadow-xl flex items-center justify-center
                                ${(!input.trim() && !attachedFile) || isLoading
                                    ? 'bg-muted text-muted-foreground'
                                    : 'btn-premium text-white shadow-primary/25'}`}>
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
                        </motion.button>
                    </div>

                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-1.5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default group">
                            <Volume2 className={`w-3.5 h-3.5 ${voiceEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{voiceEnabled ? 'Audio Active' : 'Audio Muted'}</span>
                        </div>
                        <div className="w-px h-3 bg-border" />
                        <div className="flex items-center gap-1.5 opacity-40 cursor-default">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Powered by GPT-4o</span>
                        </div>
                    </div>
                </div>

                <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden"
                    accept=".js,.ts,.jsx,.tsx,.json,.html,.css,.txt,.md,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs"
                    onChange={handleFileChange} />
            </motion.div>
        </>
    );
};

export default AIAssistant;
