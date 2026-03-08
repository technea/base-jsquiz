"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, PlayCircle } from 'lucide-react';

interface DailyGMIntroProps {
    onComplete: () => void;
    isDarkMode: boolean;
}

export const DailyGMIntro = ({ onComplete, isDarkMode }: DailyGMIntroProps) => {
    const [phase, setPhase] = useState<'intro' | 'speaking' | 'done'>('intro');
    const [bubbleText, setBubbleText] = useState('');
    const fullText = "Good morning! Time for your daily quiz!";

    useEffect(() => {
        // Typing effect for the bubble
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

            <div className="relative max-w-sm w-full space-y-8">
                {/* Avatar Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        y: [0, -8, 0], // Breathing/Floating
                        rotate: [0, 1, -1, 0] // Subtle head tilt/sway
                    }}
                    transition={{
                        scale: { duration: 0.5, type: 'spring' },
                        y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                    }}
                    className="relative w-64 h-64 mx-auto rounded-full border-4 border-amber-400/30 overflow-hidden shadow-2xl shadow-amber-500/20"
                >
                    <img
                        src="/daily-gm-avatar.png"
                        alt="Daily Quiz Assistant"
                        className="w-full h-full object-cover"
                    />

                    {/* Blink Effect Overlay */}
                    <motion.div
                        animate={{ opacity: [0, 0, 1, 0, 0] }}
                        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
                        className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none"
                        style={{ clipPath: 'inset(40% 0 55% 0)' }} // Simulated blink
                    />
                </motion.div>

                {/* Speech Bubble */}
                <AnimatePresence>
                    {phase !== 'intro' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-amber-400/20"
                        >
                            {/* Bubble Pointer */}
                            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-bottom-[12px] border-bottom-white dark:border-bottom-slate-800 rotate-180" />

                            <p className="text-lg font-black tracking-tight text-amber-500 uppercase leading-snug">
                                {bubbleText}
                                <motion.span
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                    className="inline-block w-1 h-5 bg-amber-500 ml-1 translate-y-1"
                                />
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Interaction Button */}
                {phase === 'intro' && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPhase('speaking')}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3"
                    >
                        <PlayCircle className="w-8 h-8" />
                        Listen to Intro
                    </motion.button>
                )}

                {phase === 'done' && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onComplete}
                        className="w-full py-5 rounded-2xl bg-primary text-white font-black text-xl shadow-xl shadow-primary/30"
                    >
                        LETS GO! 🚀
                    </motion.button>
                )}
            </div>

            {/* Cinematic Overlay */}
            <div className="fixed inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>
    );
};
