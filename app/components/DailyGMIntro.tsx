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
    const fullText = "Good morning! Time for your daily quiz!";

    useEffect(() => {
        if (phase === 'speaking') {
            let i = 0;
            const interval = setInterval(() => {
                setBubbleText(fullText.slice(0, i + 1));
                i++;
                if (i >= fullText.length) {
                    clearInterval(interval);
                    setTimeout(() => setPhase('done'), 1500);
                }
            }, 60);

            // Try speech synthesis
            try {
                const utterance = new SpeechSynthesisUtterance(fullText);
                utterance.pitch = 1.1;
                utterance.rate = 1.0;
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
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? 'bg-slate-900/95' : 'bg-slate-50/95'
                } backdrop-blur-xl`}
        >
            {/* Background Sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -150],
                            x: [0, Math.random() * 20 - 10],
                            opacity: [0, 0.4, 0],
                            scale: [0.5, 1, 0.5],
                            rotate: [0, 90, 180]
                        }}
                        transition={{
                            duration: Math.random() * 4 + 3,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                        className="absolute flex items-center justify-center font-black text-2xl opacity-10 pointer-events-none"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            color: i % 2 === 0 ? '#fbbf24' : '#60a5fa'
                        }}
                    >
                        {i % 3 === 0 ? '?' : i % 3 === 1 ? '!' : '{ }'}
                    </motion.div>
                ))}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`sparkle-${i}`}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.1, 0.4, 0.1],
                        }}
                        transition={{
                            duration: Math.random() * 2 + 1,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                        className="absolute text-amber-300"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    >
                        <Sparkles className="w-3 h-3" />
                    </motion.div>
                ))}
            </div>

            <div className="relative max-w-sm w-full space-y-6">
                {/* ✨ ANIMATED AVATAR - Interactive & Alive */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex justify-center"
                >
                    <AnimatedAvatar
                        size={220}
                        isSpeaking={phase === 'speaking'}
                        mood={avatarMood}
                    />
                </motion.div>

                {/* Title Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1"
                >
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full shadow-lg shadow-amber-500/5"
                    >
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Quiz Mentor</span>
                    </motion.div>
                </motion.div>

                {/* Speech Bubble */}
                <AnimatePresence>
                    {phase !== 'intro' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="relative"
                        >
                            {/* Arrow pointer */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 bg-white dark:bg-slate-800 border-t border-l border-amber-400/20" />
                            <div className={`relative p-6 rounded-3xl shadow-2xl border-2 border-amber-400/20 ${isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-sm`}>
                                <p className="text-lg font-black tracking-tight text-amber-500 uppercase leading-snug">
                                    {bubbleText}
                                    <motion.span
                                        animate={{ opacity: [0, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.5 }}
                                        className="inline-block w-1 h-5 bg-amber-500 ml-1 translate-y-1"
                                    />
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Interaction Button */}
                {phase === 'intro' && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPhase('speaking')}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xl shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <PlayCircle className="w-8 h-8 relative z-10" />
                        <span className="relative z-10">Listen to Intro</span>
                    </motion.button>
                )}

                {phase === 'done' && (
                    <motion.button
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onComplete}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-500 via-primary to-indigo-600 text-white font-black text-xl shadow-2xl shadow-primary/30 relative overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <span className="relative z-10">LETS GO! 🚀</span>
                    </motion.button>
                )}
            </div>

            {/* Cinematic Overlay */}
            <div className="fixed inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>
    );
};
