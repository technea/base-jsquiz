"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, ChevronLeft, GraduationCap, Layers } from 'lucide-react';
import { BASE_LESSONS, BaseLesson } from '../baseLearningData';

interface BaseLearningProps {
    isDarkMode: boolean;
}

export const BaseLearning = ({ isDarkMode }: BaseLearningProps) => {
    const [selectedLesson, setSelectedLesson] = useState<BaseLesson | null>(null);

    // Lesson Selection View
    if (!selectedLesson) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-500/30 border border-white/10">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.3em] mb-1">Onchain Curriculum</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Base Weekly Learning</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Master the Base ecosystem with in-depth lessons and code examples
                        </p>
                    </div>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BASE_LESSONS.map((lesson, idx) => (
                        <motion.button
                            key={lesson.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedLesson(lesson)}
                            className="glass-card p-5 text-left relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300"
                        >
                            {/* Ambient glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                                    {lesson.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] font-extrabold text-blue-500 uppercase tracking-[0.2em]">Week {lesson.id}</span>
                                    </div>
                                    <h3 className="font-extrabold text-base tracking-tight text-foreground truncate">{lesson.title}</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium">{lesson.subtitle}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1 text-muted-foreground group-hover:text-blue-500 transition-colors">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">{lesson.modules.length}</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Info Bar */}
                <div className="flex items-center justify-center gap-8 py-4">
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{BASE_LESSONS.length}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lessons</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-blue-500">{BASE_LESSONS.reduce((a, l) => a + l.modules.length, 0)}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Chapters</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">∞</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Knowledge</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Lesson Detail View
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            {/* Back Button + Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSelectedLesson(null)}
                    className="p-2.5 rounded-xl bg-muted/50 border border-border hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <p className="text-[9px] font-extrabold text-blue-500 uppercase tracking-[0.3em] mb-0.5">Week {selectedLesson.id}</p>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <span>{selectedLesson.emoji}</span>
                        {selectedLesson.title}
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">{selectedLesson.subtitle}</p>
                </div>
            </div>

            {/* Modules */}
            <div className="grid grid-cols-1 gap-8">
                {selectedLesson.modules.map((module, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.12 }}
                        className="glass-card overflow-hidden hover:border-blue-500/30 transition-all duration-300"
                    >
                        {/* Module Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center gap-4 bg-muted/30">
                            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-extrabold text-sm shadow-lg shadow-blue-500/20">
                                {idx + 1}
                            </div>
                            <h4 className="font-extrabold text-base tracking-tight text-foreground">{module.title}</h4>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* Key Concepts */}
                            <div className="p-6 sm:p-8 lg:col-span-7 space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-5 bg-violet-500 rounded-full" />
                                    <h5 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Key Concepts</h5>
                                </div>
                                <div className="space-y-4">
                                    {module.points.map((point, pIdx) => {
                                        // Parse **bold** markers
                                        const parts = point.split(/\*\*([^*]+)\*\*/g);
                                        return (
                                            <div key={pIdx} className="flex gap-4 items-start group/p">
                                                <div className="w-6 h-6 rounded-lg bg-violet-500/5 flex items-center justify-center text-violet-500 mt-0.5 shrink-0 group-hover/p:bg-violet-500/10 transition-colors">
                                                    <span className="text-xs">▸</span>
                                                </div>
                                                <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                                                    {parts.map((part, pi) =>
                                                        pi % 2 === 1
                                                            ? <strong key={pi} className="text-blue-500 font-bold">{part}</strong>
                                                            : <span key={pi}>{part.split(/`([^`]+)`/).map((seg, si) =>
                                                                si % 2 === 1
                                                                    ? <code key={si} className="px-1 py-0.5 rounded-lg font-mono text-[10px] border bg-blue-500/10 text-blue-500 border-blue-500/20 mx-0.5">{seg}</code>
                                                                    : <span key={si}>{seg}</span>
                                                            )}</span>
                                                    )}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Code Preview */}
                            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border bg-[#0d1117] relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none uppercase text-white font-black text-4xl tracking-tighter">
                                    Code
                                </div>
                                <div className="p-6 sm:p-8 h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Example</span>
                                    </div>
                                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                                        <pre className="text-xs sm:text-sm font-mono leading-relaxed text-emerald-400">
                                            <code>{module.code}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                {selectedLesson.id > 1 ? (
                    <button
                        onClick={() => setSelectedLesson(BASE_LESSONS[selectedLesson.id - 2])}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-bold hover:border-blue-500/20 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>
                ) : <div />}
                {selectedLesson.id < BASE_LESSONS.length ? (
                    <button
                        onClick={() => setSelectedLesson(BASE_LESSONS[selectedLesson.id])}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Next Week
                        <ChevronRight className="w-4 h-4" />
                    </button>
                ) : <div />}
            </div>
        </motion.div>
    );
};
