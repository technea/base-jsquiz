"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, PlayCircle } from 'lucide-react';
import { AnimatedAvatar } from './AnimatedAvatar';

interface DailyGMIntroProps {
    onComplete: () => void;
    isDarkMode: boolean;
}

export const DailyGMIntro = ({ onComplete, isDarkMode }: DailyGMIntroProps) => {
    const [phase, setPhase] = useState<'intro' | 'speaking' | 'done'>('intro');
    const [bubbleText, setBubbleText] = useState('');
    const fullText = "Welcome to your Daily Arena! Ready to sharpen your skills?";

    useEffect(() => {
        if (phase === 'speaking') {
            let i = 0;
            const interval = setInterval(() => {
                setBubbleText(fullText.slice(0, i + 1));
                i++;
                if (i >= fullText.length) {
                    clearInterval(interval);
                    setTimeout(() => setPhase('done'), 1200);
                }
            }, 50);

            try {
                const utterance = new SpeechSynthesisUtterance(fullText);
                const voices = window.speechSynthesis.getVoices();
                const clearVoice = voices.find(v => v.lang.startsWith('en') && /Google|Natural|Enhanced|Neural|Premium/.test(v.name)) 
                               || voices.find(v => v.lang.startsWith('en-US')) 
                               || voices.find(v => v.lang.startsWith('en'));
                
                if (clearVoice) utterance.voice = clearVoice;
                utterance.lang = 'en-US';
                utterance.pitch = 1.0;
                utterance.rate = 1.05;
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.warn('Speech synthesis failed', e);
            }

            return () => clearInterval(interval);
        }
    }, [phase]);

    const avatarMood = phase === 'intro' ? 'waving' : phase === 'speaking' ? 'happy' : 'excited';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center ${
                isDarkMode ? 'bg-slate-950/98' : 'bg-slate-50/98'
            } backdrop-blur-2xl`}
        >
            {/* Immersive Particle Field */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -200],
                            x: [0, (Math.random() - 0.5) * 40],
                            opacity: [0, 0.4, 0],
                            scale: [0.5, 1.2, 0.5],
                            rotate: [0, 180]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 4,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        className="absolute flex items-center justify-center font-bold text-lg opacity-10 pointer-events-none"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            color: i % 2 === 0 ? 'var(--primary)' : 'var(--accent-amber)'
                        }}
                    >
                        {i % 4 === 0 ? '< />' : i % 4 === 1 ? 'js' : i % 4 === 2 ? 'const' : '=>'}
                    </motion.div>
                ))}
            </div>

            <div className="relative max-w-md w-full space-y-10">
                {/* Visual Anchor - Avatar */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
                        <AnimatedAvatar
                            size={240}
                            isSpeaking={phase === 'speaking'}
                            mood={avatarMood}
                        />
                    </div>
                </motion.div>

                <div className="space-y-6 relative z-10">
                    {/* Status Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2 px-5 py-2 glass-card border-primary/20 bg-primary/5 shadow-xl shadow-primary/5">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary">Daily Interface v2.0</span>
                        </div>
                    </motion.div>

                    {/* Dynamic Messaging Area */}
                    <div className="min-h-[120px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {phase === 'intro' ? (
                                <motion.div
                                    key="intro-msg"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                                        Hello <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">Developer</span>
                                    </h1>
                                    <p className="text-base text-muted-foreground font-medium max-w-xs mx-auto">
                                        Your personalized daily challenge is ready.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="speaking-msg"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card p-6 sm:p-8 border-2 border-primary/20 shadow-2xl shadow-primary/10 relative"
                                >
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 bg-card border-t-2 border-l-2 border-primary/20" />
                                    <p className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                                        {bubbleText}
                                        <motion.span
                                            animate={{ opacity: [0, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="inline-block w-1.5 h-6 bg-primary ml-1.5 translate-y-1"
                                        />
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Layer */}
                    <div className="pt-4">
                        {phase === 'intro' ? (
                            <motion.button
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setPhase('speaking')}
                                className="w-full py-4 rounded-xl bg-foreground text-background font-extrabold text-base shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-4 group"
                            >
                                <PlayCircle className="w-5 h-5 group-hover:text-primary transition-colors" />
                                <span>Initialize Intro</span>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        ) : phase === 'done' ? (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onComplete}
                                className="btn-premium w-full py-4 rounded-xl font-extrabold text-lg flex items-center justify-center gap-3"
                            >
                                <span className="tracking-tight">ENTER ARENA</span>
                                <span className="text-xl">🚀</span>
                            </motion.button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Aesthetic Background Detail */}
            <div className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-end opacity-20 pointer-events-none">
                <div className="text-[60px] font-black text-foreground/10 select-none leading-none -ml-4">GM</div>
                <div className="text-[10px] font-mono text-foreground uppercase tracking-[0.5em] vertical-text mb-4">Jazzmini LMS Core</div>
            </div>
        </motion.div>
    );
};
