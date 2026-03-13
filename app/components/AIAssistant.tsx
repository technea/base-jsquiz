"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Volume2, VolumeX, Loader2, Sparkles,
    X, Mic, MicOff, Paperclip, FileText, Code2, Copy, Check, 
    ChevronDown, Brain, BookOpen, HelpCircle
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
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full border-collapse min-w-[300px]">
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={index} className="hover:bg-slate-800/50">
                                {showLineNumbers && (
                                    <td className="text-right text-slate-500 text-[10px] sm:text-xs select-none px-2 py-0.5 border-r border-slate-700/60 w-8 sm:w-12">
                                        {index + 1}
                                    </td>
                                )}
                                <td className="px-3 py-0.5">
                                    <pre className="text-[12px] sm:text-[13px] leading-relaxed font-mono m-0">
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
            // Quiz completed
            onComplete?.(score);
        }
    };

    return (
        <div className="my-4 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-violet-400" />
                <span className="font-bold text-sm">Quiz Question {currentIndex + 1}/{questions.length}</span>
                <span className="ml-auto text-xs font-medium text-violet-400">Score: {score}/{questions.length}</span>
            </div>
            
            <p className="text-sm font-medium mb-4">{currentQuestion.question}</p>
            
            <div className="space-y-2 mb-4">
                {currentQuestion.options.map(option => (
                    <motion.button
                        key={option.id}
                        whileHover={!answered ? { scale: 1.02, x: 5 } : {}}
                        whileTap={!answered ? { scale: 0.98 } : {}}
                        onClick={() => handleOptionSelect(option.id, option.isCorrect)}
                        disabled={answered}
                        className={`w-full text-left p-3 rounded-xl text-sm transition-all
                            ${answered && option.isCorrect ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
                            ${answered && selectedOption === option.id && !option.isCorrect ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}
                            ${!answered ? 'hover:bg-violet-500/10 border border-violet-500/30 hover:border-violet-500/60' : ''}
                            ${selectedOption === option.id ? 'border-2 ring-2 ring-violet-500/20' : 'border'}`}
                    >
                        {option.text}
                    </motion.button>
                ))}
            </div>
            
            {showExplanation && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 rounded-xl bg-slate-800/50 text-xs"
                >
                    <span className="font-bold block mb-1">Explanation:</span>
                    {currentQuestion.explanation}
                </motion.div>
            )}
            
            {answered && (
                <button
                    onClick={handleNext}
                    className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                >
                    {currentIndex < questions.length - 1 ? 'Next Question →' : 'Complete Quiz'}
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
                        <p key={i} className={`leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px] ${i > 0 ? 'mt-2' : ''}`}>
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
                    const v = voices.find(v => v.lang.startsWith('en') && /Google|Natural|Premium|Enhanced/.test(v.name)) || voices.find(v => v.lang.startsWith('en'));
                    if (v) utt.voice = v;
                    utt.lang = 'en-US';
                    utt.rate = 1.0;
                } else {
                    const v = voices.find(v => v.lang.startsWith('ur')) || voices.find(v => v.lang.startsWith('hi'));
                    if (v) utt.voice = v;
                    utt.lang = v ? v.lang : 'hi-IN';
                    utt.rate = 0.92;
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
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className={`max-w-3xl mx-auto w-full sm:rounded-[2rem] overflow-hidden flex flex-col h-[100dvh] sm:h-[82vh] min-h-0 sm:min-h-[500px] border shadow-2xl
                    ${isDarkMode ? 'border-slate-700/50 bg-slate-900 shadow-black/50' : 'border-slate-200 bg-white shadow-slate-300/60'}`}
            >
                {/* Header */}
                <div className={`px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between shrink-0
                    ${isDarkMode ? 'border-slate-800 bg-slate-900/40 backdrop-blur-md' : 'border-slate-100 bg-white/40 backdrop-blur-md'}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">
                            <motion.div 
                                animate={{ 
                                    y: [0, -4, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                    duration: 4, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 border border-white/10"
                            >
                                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </motion.div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        </div>
                        <div>
                            <h2 className={`font-extrabold text-sm sm:text-base flex items-center gap-1 leading-none mb-0.5 sm:mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                JS Mentor <span className="hidden xs:inline">Pro</span> <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-violet-500 animate-pulse' : 'bg-emerald-400'}`} />
                                <span className={`text-[10px] sm:text-[11px] font-semibold truncate max-w-[80px] sm:max-w-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{statusText}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Quiz Mode Toggle */}
                        <motion.button 
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuizMode(!quizMode)}
                            title={quizMode ? 'Exit Quiz Mode' : 'Enter Quiz Mode'}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all shadow-sm
                                ${quizMode 
                                    ? 'bg-amber-500 text-white shadow-amber-500/30' 
                                    : isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
                            title={voiceEnabled ? 'Turn voice off' : 'Turn voice on'}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${voiceEnabled ? 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/25' : isDarkMode ? 'bg-slate-800 text-slate-500 hover:bg-slate-600 border border-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </motion.button>
                        
                        {onClose && (
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${isDarkMode ? 'text-slate-500 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-800'}`}>
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 scroll-smooth">
                    <AnimatePresence initial={false}>
                        {messages.map(msg => (
                            <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 14, scale: .96 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2.5 max-w-[95%] sm:max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow
                                        ${msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-slate-600 to-slate-900 text-white' 
                                            : msg.type === 'quiz'
                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20'
                                                : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-violet-500/20'}`}>
                                        {msg.role === 'user' ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : 
                                         msg.type === 'quiz' ? <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-tr-sm shadow-sm sm:shadow-lg shadow-violet-500/20'
                                            : msg.type === 'quiz'
                                                ? isDarkMode ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-amber-700' : 'bg-white text-slate-800 rounded-tl-sm border border-amber-200 shadow-sm'
                                                : isDarkMode ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'}`}>
                                        
                                        {msg.file && (
                                            <div className="mb-2.5 flex items-center gap-2 bg-black/15 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2">
                                                {msg.file.preview
                                                    ? <img src={msg.file.preview} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" alt="" />
                                                    : <FileText className="w-4 h-4 sm:w-5 sm:h-5 opacity-70" />}
                                                <span className="text-[10px] sm:text-xs font-semibold opacity-80 truncate max-w-[120px] sm:max-w-[180px]">{msg.file.name}</span>
                                            </div>
                                        )}
                                        
                                        {msg.role === 'assistant'
                                            ? <MessageContent content={msg.content} isDark={isDarkMode} />
                                            : <p className="leading-relaxed text-[13.5px] sm:text-[15px] whitespace-pre-wrap">{msg.content}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <motion.div key="loading" 
                                initial={{ opacity: 0, y: 10, scale: .95 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                exit={{ opacity: 0, scale: .9 }} 
                                className="flex justify-start">
                                <div className="flex gap-2.5 max-w-[90%]">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </div>
                                    <div className={`px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-2 sm:gap-3
                                        ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                        {[0, 1, 2].map(i => (
                                            <motion.span key={i} 
                                                className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-500"
                                                animate={{ y: ['0%', '-55%', '0%'] }}
                                                transition={{ duration: .55, repeat: Infinity, delay: i * .14, ease: 'easeInOut' }} />
                                        ))}
                                        <span className={`text-[13px] sm:text-sm font-medium ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {quizMode ? 'Generating quiz...' : 'Thinking...'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />

                    {/* Scroll to bottom button */}
                    <AnimatePresence>
                        {showScrollBtn && (
                            <motion.button 
                                initial={{ opacity: 0, y: 6 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: 6 }}
                                onClick={() => scrollToBottom()}
                                className="sticky bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg shadow-violet-500/30 transition-colors active:scale-95">
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Scroll down
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className={`px-4 sm:px-5 pt-3 pb-4 border-t shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/90'}`}>
                    
                    {/* Quick action buttons */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(139, 92, 246, 0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setInput("Explain this code line by line: ")}
                            className="px-4 py-2 text-xs font-bold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:border-violet-500/40 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm"
                        >
                            <Code2 className="w-3.5 h-3.5" /> Code Explanation
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(245, 158, 11, 0.2)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setInput("Generate a 5-question quiz about ")}
                            className="px-4 py-2 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm"
                        >
                            <Brain className="w-3.5 h-3.5" /> Generate Quiz
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {attachedFile && (
                            <motion.div 
                                initial={{ opacity: 0, y: 6, scale: .95 }} 
                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                exit={{ opacity: 0, scale: .9 }}
                                className="flex items-center gap-2.5 bg-violet-500/10 border border-violet-400/25 rounded-xl px-3 py-2 mb-2.5 w-fit max-w-full">
                                {attachedFile.preview
                                    ? <img src={attachedFile.preview} className="w-9 h-9 rounded-lg object-cover border border-violet-400/20" alt="" />
                                    : <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-violet-400" />
                                    </div>}
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-violet-300 truncate max-w-[200px]">{attachedFile.name}</p>
                                    <p className="text-[10px] text-violet-400/60 font-medium">Ready to analyze</p>
                                </div>
                                <button 
                                    onClick={() => setAttachedFile(null)}
                                    className="w-5 h-5 ml-1 rounded-full bg-violet-400/20 flex items-center justify-center hover:bg-red-500/70 hover:text-white text-violet-300 transition-all shrink-0">
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isListening && (
                            <motion.div 
                                initial={{ opacity: 0, y: 6 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 mb-2 text-xs font-bold text-red-400">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                Listening... (speak or tap mic to stop)
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2">
                        {/* Input field */}
                        <div className={`flex-1 flex items-center gap-1 rounded-2xl border px-2 sm:px-3 transition-all
                            ${isDarkMode ? 'bg-slate-900/80 border-slate-700 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/20'
                                : 'bg-white border-slate-200 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-500/10'}`}>

                            {/* Attach file button */}
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                title="Attach file"
                                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shrink-0 ${isDarkMode ? 'text-slate-500 hover:text-violet-400 hover:bg-slate-800' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'}`}>
                                <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>

                            {/* Text input */}
                            <input 
                                ref={inputRef} 
                                type="text" 
                                value={input}
                                onChange={e => setInput(e.target.value)} 
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    isListening
                                        ? (preferredLang === 'ur-PK' ? '🎙️ Urdu mein...' : '🎙️ Speaking...')
                                        : quizMode
                                            ? 'Quiz topic...'
                                            : (preferredLang === 'ur-PK' ? 'Sawal poochein...' : 'Ask JS question...')
                                }
                                disabled={isLoading}
                                className={`flex-1 py-3 sm:py-3.5 bg-transparent outline-none text-[13px] sm:text-sm font-medium placeholder:font-normal min-w-0
                                    ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} />

                            {/* Microphone button */}
                            {micAvailable && (
                                <button 
                                    onClick={toggleListening} 
                                    title={isListening ? 'Stop listening' : 'Voice input'}
                                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shrink-0
                                        ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                                            : isDarkMode ? 'text-slate-500 hover:text-violet-400 hover:bg-slate-800' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'}`}>
                                    {isListening ? <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                </button>
                            )}
                        </div>

                        <motion.button 
                            whileHover={(!input.trim() && !attachedFile) || isLoading ? {} : { scale: 1.1, rotate: -5 }}
                            whileTap={(!input.trim() && !attachedFile) || isLoading ? {} : { scale: 0.9, rotate: 5 }}
                            onClick={handleSend} 
                            disabled={(!input.trim() && !attachedFile) || isLoading}
                            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all shrink-0 shadow-lg active:scale-95
                                ${(!input.trim() && !attachedFile) || isLoading
                                    ? isDarkMode ? 'bg-slate-800 text-slate-700 border border-slate-700' : 'bg-slate-100 text-slate-300'
                                    : 'bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-600 text-white hover:shadow-violet-500/40 border border-white/10'}`}>
                            {isLoading ? <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin" /> : <Send className="w-4 h-4 sm:w-6 sm:h-6" />}
                        </motion.button>
                    </div>

                    <p className={`text-center text-[10px] font-semibold uppercase tracking-widest mt-2.5 select-none
                        ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>
                        {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
                        {' • '}Enter to send{' • '}📎 Attach Code File
                        {micAvailable ? ` • 🎙️ Mic (${preferredLang === 'ur-PK' ? 'Urdu' : 'Eng'})` : ''}
                    </p>
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
