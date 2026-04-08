"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, ChevronLeft, GraduationCap, Layers, CheckCircle, Clock, Star, BookMarked, Lock, Calendar } from 'lucide-react';
import { BASE_LESSONS, BaseLesson } from '../baseLearningData';
import { getCurrentWeek, getWeekStartDate, formatWeekDates } from '../baseQuizData';

interface BaseLearningProps {
    isDarkMode: boolean;
}

export const BaseLearning = ({ isDarkMode }: BaseLearningProps) => {
    const [selectedLesson, setSelectedLesson] = useState<BaseLesson | null>(null);
    const [readLessons, setReadLessons] = useState<Record<number, boolean>>(() => {
        if (typeof window === 'undefined') return {};
        try { return JSON.parse(localStorage.getItem('baseLearningRead') || '{}'); } catch { return {}; }
    });

    const markAsRead = (lessonId: number) => {
        const updated = { ...readLessons, [lessonId]: true };
        setReadLessons(updated);
        localStorage.setItem('baseLearningRead', JSON.stringify(updated));
    };

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const getCountdown = (date: Date) => {
        const diff = date.getTime() - now.getTime();
        if (diff <= 0) return 'Unlocked';
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        return `${d}d ${h}h ${m}m ${s}s`;
    };

    const totalModules = BASE_LESSONS.reduce((a, l) => a + l.modules.length, 0);
    const totalPoints = BASE_LESSONS.reduce((a, l) => a + l.modules.reduce((b, m) => b + m.points.length, 0), 0);
    const readCount = Object.keys(readLessons).length;

    const currentWeek = getCurrentWeek();

    // Lesson Selection View
    if (!selectedLesson) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-white/10">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.3em] mb-1">Onchain Curriculum</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Base Weekly Learning</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            Master the Base ecosystem with in-depth lessons, code examples & real-world patterns
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Your Progress</span>
                        <span className="text-[10px] font-extrabold text-blue-500">{readCount}/{BASE_LESSONS.length} Completed</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(readCount / BASE_LESSONS.length) * 100}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        />
                    </div>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BASE_LESSONS.map((lesson, idx) => {
                        const isRead = readLessons[lesson.id];
                        const isUnlocked = lesson.id === 1 || (readLessons[lesson.id - 1] && currentWeek >= lesson.id);
                        const dateRange = formatWeekDates(lesson.id);
                        const weekStart = getWeekStartDate(lesson.id);
                        const isTimeLocked = currentWeek < lesson.id && (lesson.id === 1 || readLessons[lesson.id - 1]);

                        return (
                            <motion.button
                                key={lesson.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={isUnlocked ? { y: -4, scale: 1.01 } : {}}
                                whileTap={isUnlocked ? { scale: 0.98 } : {}}
                                onClick={() => isUnlocked && setSelectedLesson(lesson)}
                                disabled={!isUnlocked}
                                className={`glass-card p-5 text-left relative overflow-hidden group transition-all duration-300 ${
                                    !isUnlocked
                                        ? 'opacity-50 cursor-not-allowed grayscale-[30%]'
                                        : isRead ? 'border-emerald-500/20' : 'hover:border-blue-500/20'
                                }`}
                            >
                                {/* Lock overlay */}
                                {!isUnlocked && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-2xl">
                                        <div className="flex flex-col items-center gap-1">
                                            <Lock className="w-6 h-6 text-muted-foreground" />
                                            {isTimeLocked ? (
                                                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider tabular-nums">Unlocks in {getCountdown(weekStart)}</span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Complete Week {lesson.id - 1}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Ambient glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Read badge */}
                                {isRead && isUnlocked && (
                                    <div className="absolute top-3 right-3 z-20">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform ${isUnlocked ? 'group-hover:scale-110' : ''} ${
                                        isRead
                                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20'
                                            : 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20'
                                    }`}>
                                        {lesson.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${isRead ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                Week {lesson.id}
                                            </span>
                                            <span className="text-[8px] text-muted-foreground/80 font-medium ml-auto flex items-center gap-1">
                                                <Calendar className="w-2.5 h-2.5" /> {dateRange}
                                            </span>
                                        </div>
                                        <h3 className="font-extrabold text-base tracking-tight text-foreground truncate">{lesson.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                <Layers className="w-3 h-3" /> {lesson.modules.length} chapters
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" /> {lesson.modules.reduce((a, m) => a + m.points.length, 0)} concepts
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-center">
                                        {isUnlocked ? (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 py-4">
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{BASE_LESSONS.length}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Weeks</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-blue-500">{totalModules}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Chapters</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-foreground">{totalPoints}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Key Facts</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                        <p className="text-2xl font-extrabold text-emerald-500">{readCount}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Read</p>
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
                {!readLessons[selectedLesson.id] && (
                    <button
                        onClick={() => markAsRead(selectedLesson.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Read
                    </button>
                )}
                {readLessons[selectedLesson.id] && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Completed
                    </div>
                )}
            </div>

            {/* Chapter Overview */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <BookMarked className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">In this lesson</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedLesson.modules.map((module, idx) => (
                        <a
                            key={idx}
                            href={`#module-${idx}`}
                            className="px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/15 text-[11px] font-bold text-foreground/80 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 transition-all"
                        >
                            {idx + 1}. {module.title}
                        </a>
                    ))}
                </div>
            </div>

            {/* Modules */}
            <div className="grid grid-cols-1 gap-8">
                {selectedLesson.modules.map((module, idx) => (
                    <motion.div
                        key={idx}
                        id={`module-${idx}`}
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
                            <span className="ml-auto text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                {module.points.length} concepts
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* Key Concepts */}
                            <div className="p-6 sm:p-8 lg:col-span-7 space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-5 bg-blue-500 rounded-full" />
                                    <h5 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Key Concepts</h5>
                                </div>
                                <div className="space-y-4">
                                    {module.points.map((point, pIdx) => {
                                        const isCheckmark = point.startsWith('✅');
                                        const cleanPoint = isCheckmark ? point.slice(2).trim() : point;
                                        const parts = cleanPoint.split(/\*\*([^*]+)\*\*/g);
                                        return (
                                            <div key={pIdx} className={`flex gap-3 items-start group/p ${isCheckmark ? 'pl-1' : ''}`}>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                                    isCheckmark
                                                        ? 'bg-emerald-500/10 text-emerald-500 group-hover/p:bg-emerald-500/20'
                                                        : 'bg-blue-500/5 text-blue-500 group-hover/p:bg-blue-500/10'
                                                }`}>
                                                    <span className="text-xs">{isCheckmark ? '✓' : '▸'}</span>
                                                </div>
                                                <p className={`text-sm leading-relaxed font-medium ${isCheckmark ? 'text-foreground' : 'text-foreground/80'}`}>
                                                    {parts.map((part, pi) =>
                                                        pi % 2 === 1
                                                            ? <strong key={pi} className="text-blue-500 font-bold">{part}</strong>
                                                            : <span key={pi}>{part.split(/`([^`]+)`/).map((seg, si) =>
                                                                si % 2 === 1
                                                                    ? <code key={si} className="px-1.5 py-0.5 rounded-lg font-mono text-[10px] border bg-blue-500/10 text-blue-500 border-blue-500/20 mx-0.5">{seg}</code>
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
                        Week {selectedLesson.id - 1}
                    </button>
                ) : <div />}

                {!readLessons[selectedLesson.id] && (
                    <button
                        onClick={() => {
                            markAsRead(selectedLesson.id);
                            setSelectedLesson(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Complete Lesson
                    </button>
                )}

                {selectedLesson.id < BASE_LESSONS.length && selectedLesson.id + 1 === 1 ? (
                    <button
                        onClick={() => setSelectedLesson(BASE_LESSONS[selectedLesson.id])}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Week {selectedLesson.id + 1}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                ) : <div />}
            </div>
        </motion.div>
    );
};
