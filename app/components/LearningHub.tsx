"use client";

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { TOTAL_LEVELS, LEVEL_ICONS, LEVEL_TOPICS, LEARNING_CONTENT } from '../types';

interface LearningHubProps {
    isDarkMode: boolean;
    learningLevel: number;
    setLearningLevel: (level: number) => void;
    levelAttempts: Record<number, number>;
    highestLevel: number;
}

export const LearningHub = ({
    isDarkMode,
    learningLevel,
    setLearningLevel,
    levelAttempts,
    highestLevel
}: LearningHubProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            {/* Level Tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
                {[...Array(TOTAL_LEVELS)].map((_, i) => {
                    const lvl = i + 1;
                    const attempted = (levelAttempts[lvl] || 0) > 0;
                    return (
                        <button
                            key={i}
                            onClick={() => setLearningLevel(lvl)}
                            className={`relative px-4 py-2 rounded-xl text-sm font-black tracking-tight transition-all ${learningLevel === lvl
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'glass-card text-slate-500 hover:text-primary'
                                }`}
                        >
                            {LEVEL_ICONS[i]} Lvl {lvl}
                            {attempted && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-6">
                {/* Header */}
                <div className={`p-4 sm:p-5 glass-card flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl shrink-0">
                            {LEVEL_ICONS[learningLevel - 1]}
                        </div>
                        <div className="flex-1 sm:hidden">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Level {learningLevel} Guide</p>
                            <h2 className="text-xl font-black text-primary break-words leading-tight mt-0.5">{LEVEL_TOPICS[learningLevel - 1]}</h2>
                        </div>
                    </div>

                    <div className="hidden sm:block flex-1 border-l sm:border-none pl-4 sm:pl-0 border-white/10">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Level {learningLevel} — Study Guide</p>
                        <h2 className="text-3xl font-black text-primary">{LEVEL_TOPICS[learningLevel - 1]}</h2>
                    </div>

                    <div className="flex w-full sm:w-auto justify-between sm:justify-end items-center sm:text-right shrink-0 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-white/10">
                        <p className={`text-xs uppercase font-black tracking-[0.2em] sm:hidden ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>Total Topics</p>
                        <div className="sm:hidden text-right">
                            <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{LEARNING_CONTENT[learningLevel]?.length}</p>
                        </div>

                        <div className="hidden sm:block">
                            <p className={`text-xs uppercase font-black tracking-[0.2em] ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>Topics</p>
                            <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{LEARNING_CONTENT[learningLevel]?.length}</p>
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 gap-5">
                    {LEARNING_CONTENT[learningLevel]?.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                    {idx + 1}
                                </div>
                                <h4 className={`font-black text-base ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2">
                                {/* Key Points */}
                                <div className="p-5 space-y-2.5">
                                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>📌 Key Points</p>
                                    {item.points.map((p, pIdx) => {
                                        // Render inline code (backtick syntax)
                                        const parts = p.split(/`([^`]+)`/);
                                        return (
                                            <div key={pIdx} className="flex gap-2.5 items-start">
                                                <span className="text-primary mt-0.5 shrink-0 text-xs">▸</span>
                                                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                                                    {parts.map((part, pi) =>
                                                        pi % 2 === 1
                                                            ? <code key={pi} className={`px-1.5 py-0.5 rounded-md font-mono text-xs border ${isDarkMode
                                                                ? 'bg-primary/15 text-primary border-primary/20'
                                                                : 'bg-primary/10 text-primary border-primary/30'
                                                                }`}>{part}</code>
                                                            : <span key={pi}>{part}</span>
                                                    )}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Code Example */}
                                <div className="border-t sm:border-t-0 sm:border-l border-white/5 p-5 bg-slate-900/50">
                                    <p className={`text-xs font-black uppercase tracking-[0.2em] mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>💻 Code Example</p>
                                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-sm overflow-x-auto selection:bg-primary/30">
                                        <code>{item.code}</code>
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
