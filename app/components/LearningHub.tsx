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
            className="space-y-12"
        >
            {/* Navigation Tabs - Refined Style */}
            <div className="flex flex-wrap gap-3 justify-center">
                {[...Array(TOTAL_LEVELS)].map((_, i) => {
                    const lvl = i + 1;
                    const isUnlocked = lvl <= highestLevel;
                    const attempted = (levelAttempts[lvl] || 0) > 0;
                    const isActive = learningLevel === lvl;

                    return (
                        <button
                            key={i}
                            onClick={() => isUnlocked && setLearningLevel(lvl)}
                            disabled={!isUnlocked}
                            className={`relative px-5 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 border-2
                                ${!isUnlocked
                                    ? 'bg-muted/30 border-transparent text-muted-foreground cursor-not-allowed opacity-50'
                                    : isActive
                                        ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105 z-10'
                                        : 'glass-card border-transparent text-foreground/60 hover:text-primary hover:border-primary/20 hover:bg-primary/5'
                                }`}
                        >
                            {!isUnlocked ? (
                                <span className="opacity-50 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Lvl {lvl}</span>
                            ) : (
                                <>
                                    <span>{LEVEL_ICONS[i]}</span>
                                    <span>Lvl {lvl}</span>
                                </>
                            )}
                            {isUnlocked && attempted && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-lg shadow-emerald-500/20" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-8">
                {/* Hero Header Card */}
                <div className="glass-card p-6 sm:p-8 relative overflow-hidden group">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-700" />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 text-center sm:text-left">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary via-indigo-600 to-violet-600 flex items-center justify-center text-4xl shadow-2xl shadow-primary/20 border border-white/10 shrink-0 transform -rotate-6 transition-transform group-hover:rotate-0 duration-500">
                            {LEVEL_ICONS[learningLevel - 1]}
                        </div>
                        
                        <div className="flex-1">
                            <p className="text-[9px] font-extrabold text-primary uppercase tracking-[0.3em] mb-2 pl-0.5">Level {learningLevel} Curriculum</p>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                                {LEVEL_TOPICS[learningLevel - 1]}
                            </h2>
                        </div>

                        <div className="shrink-0 flex items-center gap-6 sm:pl-8 sm:border-l border-border">
                            <div className="text-center">
                                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Modules</p>
                                <p className="text-3xl font-extrabold text-foreground">{LEARNING_CONTENT[learningLevel]?.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Modules Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {LEARNING_CONTENT[learningLevel]?.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.12 }}
                            className="glass-card overflow-hidden hover:border-primary/30 transition-all duration-300"
                        >
                            {/* Module Header */}
                            <div className="px-6 py-4 border-b border-border flex items-center gap-4 bg-muted/30">
                                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-sm shadow-lg shadow-primary/20">
                                    {idx + 1}
                                </div>
                                <h4 className="font-extrabold text-base tracking-tight text-foreground">{item.title}</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12">
                                {/* Key Concept Details */}
                                <div className="p-8 lg:col-span-7 space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-5 bg-primary rounded-full" />
                                        <h5 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Core Concepts</h5>
                                    </div>
                                    <div className="space-y-4">
                                        {item.points.map((p, pIdx) => {
                                            const parts = p.split(/`([^`]+)`/);
                                            return (
                                                <div key={pIdx} className="flex gap-4 items-start group/p">
                                                    <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center text-primary mt-0.5 shrink-0 group-hover/p:bg-primary/10 transition-colors">
                                                        <span className="text-xs">▸</span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                                                        {parts.map((part, pi) =>
                                                            pi % 2 === 1
                                                                ? <code key={pi} className="px-1 py-0.5 rounded-lg font-mono text-[10px] border bg-primary/10 text-primary border-primary/20 mx-1">{part}</code>
                                                                : <span key={pi}>{part}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Code Implementation Preview */}
                                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border bg-[#0d1117] relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none uppercase text-white font-black text-4xl tracking-tighter">Code</div>
                                    <div className="p-8 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Example Snippet</span>
                                        </div>
                                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                                            <pre className="text-xs sm:text-sm font-mono leading-relaxed text-emerald-400">
                                                <code>{item.code}</code>
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
