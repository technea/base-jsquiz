"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, XCircle, Trophy, ArrowLeft, Zap, Star, Clock, BookOpen, Wallet, RefreshCw, Lock, Calendar } from 'lucide-react';
import { BASE_QUIZ_DATA, WEEK_THEMES, getCurrentWeek, getWeekStartDate, getQuizByWeek, isWeekUnlocked, isWeekActive, getDaysRemaining, formatWeekDates, BaseQuizQuestion } from '../baseQuizData';

interface WeeklyBaseQuizProps {
    isDarkMode: boolean;
    onPayment: (amount: number) => Promise<any>;
    onScoreUpdate?: (week: number, score: number) => void;
}

export const WeeklyBaseQuiz = ({ isDarkMode, onPayment, onScoreUpdate }: WeeklyBaseQuizProps) => {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [quizState, setQuizState] = useState<'select' | 'in_progress' | 'result'>('select');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const [completedWeeks, setCompletedWeeks] = useState<Record<number, number>>(() => {
        if (typeof window === 'undefined') return {};
        try { return JSON.parse(localStorage.getItem('baseQuizCompleted') || '{}'); } catch { return {}; }
    });
    const [attempts, setAttempts] = useState<Record<number, number>>(() => {
        if (typeof window === 'undefined') return {};
        try { return JSON.parse(localStorage.getItem('baseQuizAttempts') || '{}'); } catch { return {}; }
    });
    const [paidWeeks, setPaidWeeks] = useState<Record<number, boolean>>(() => {
        if (typeof window === 'undefined') return {};
        try { return JSON.parse(localStorage.getItem('baseQuizPaid') || '{}'); } catch { return {}; }
    });

    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [showPayment, setShowPayment] = useState(false);
    const [pendingWeek, setPendingWeek] = useState<number | null>(null);

    const currentWeek = getCurrentWeek();
    const questions = selectedWeek ? getQuizByWeek(selectedWeek) : [];
    const currentQuestion = questions[currentIdx];

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

    // 30-second timer
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        setTimeLeft(30);
    }, [currentIdx, selectedWeek]);

    const handleAnswer = useCallback((opt: string) => {
        if (selectedOpt) return;
        setSelectedOpt(opt);
        if (opt === currentQuestion?.answer) {
            setScore(s => s + 10);
        }
        setShowExplanation(true);
    }, [selectedOpt, currentQuestion]);

    useEffect(() => {
        if (!selectedWeek || quizState !== 'in_progress') return;
        if (selectedOpt || timeLeft === 0) {
            if (timeLeft === 0 && !selectedOpt) {
                handleAnswer("TIME_EXPIRED");
            }
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev: number) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, selectedOpt, quizState, selectedWeek, handleAnswer]);

    const startQuiz = useCallback((week: number) => {
        // Check if week is unlocked (previous weeks completed + time arrived)
        if (!isWeekUnlocked(week, completedWeeks)) return;

        // Check attempt limit
        const weekAttempts = attempts[week] || 0;
        if (weekAttempts >= 2 && !paidWeeks[week]) {
            setPendingWeek(week);
            setShowPayment(true);
            return;
        }
        setSelectedWeek(week);
        setCurrentIdx(0);
        setScore(0);
        setSelectedOpt(null);
        setShowExplanation(false);
        setQuizState('in_progress');
    }, [attempts, paidWeeks, completedWeeks]);

    const handleUnlock = useCallback(async () => {
        if (!pendingWeek) return;
        setPaymentStatus('pending');
        try {
            const tx = await onPayment(30000); // 0.03 USDC
            if (tx) {
                const updated = { ...paidWeeks, [pendingWeek]: true };
                setPaidWeeks(updated);
                localStorage.setItem('baseQuizPaid', JSON.stringify(updated));
                setPaymentStatus('success');
                setTimeout(() => {
                    setShowPayment(false);
                    setPaymentStatus('idle');
                    startQuiz(pendingWeek);
                }, 1500);
            }
        } catch (e) {
            setPaymentStatus('error');
        }
    }, [pendingWeek, onPayment, paidWeeks, startQuiz]);

    const handleFreeUnlock = useCallback(() => {
        if (!pendingWeek) return;
        const updated = { ...paidWeeks, [pendingWeek]: true };
        setPaidWeeks(updated);
        localStorage.setItem('baseQuizPaid', JSON.stringify(updated));
        setShowPayment(false);
        setPaymentStatus('idle');
        startQuiz(pendingWeek);
    }, [pendingWeek, paidWeeks, startQuiz]);

    const handleNext = useCallback(() => {
        if (currentIdx === questions.length - 1) {
            const actualScore = selectedOpt === currentQuestion.answer ? score + 10 : score;
            setQuizState('result');

            // Increment attempts
            const newAttempts = { ...attempts, [selectedWeek!]: (attempts[selectedWeek!] || 0) + 1 };
            setAttempts(newAttempts);
            localStorage.setItem('baseQuizAttempts', JSON.stringify(newAttempts));

            if (selectedWeek) {
                const best = Math.max(completedWeeks[selectedWeek] || 0, actualScore);
                if (best !== completedWeeks[selectedWeek]) {
                    const updated = { ...completedWeeks, [selectedWeek]: best };
                    setCompletedWeeks(updated);
                    localStorage.setItem('baseQuizCompleted', JSON.stringify(updated));
                    onScoreUpdate?.(selectedWeek, best);
                }
            }
        } else {
            setCurrentIdx(i => i + 1);
            setSelectedOpt(null);
            setShowExplanation(false);
        }
    }, [currentIdx, questions.length, selectedWeek, score, selectedOpt, currentQuestion, completedWeeks, attempts]);

    const goBack = useCallback(() => {
        setQuizState('select');
        setSelectedWeek(null);
        setCurrentIdx(0);
        setScore(0);
        setSelectedOpt(null);
        setShowExplanation(false);
    }, []);

    // ── Payment Modal ──
    const renderPaymentModal = () => (
        <AnimatePresence>
            {showPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { setShowPayment(false); setPaymentStatus('idle'); }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-card relative w-full max-w-md p-8 space-y-6 shadow-2xl border border-border/50"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <Lock className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Attempts Used</h2>
                                <p className="text-muted-foreground font-medium text-sm mt-1">
                                    You've used 2 free attempts. Support the creator with <strong className="text-blue-500">$0.03 USDC</strong> for unlimited retries, or continue for free.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUnlock}
                                disabled={paymentStatus === 'pending'}
                                className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {paymentStatus === 'pending' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                                {paymentStatus === 'pending' ? 'Processing...' : paymentStatus === 'success' ? '✓ Unlocked!' : 'Support with $0.03 USDC'}
                            </button>
                            <button 
                                onClick={handleFreeUnlock}
                                disabled={paymentStatus === 'pending'}
                                className="w-full py-4 rounded-xl bg-muted/50 border border-border text-foreground font-black text-xs uppercase tracking-[0.15em] hover:bg-muted/80 transition-colors"
                            >
                                Continue for Free
                            </button>
                            <button onClick={() => { setShowPayment(false); setPaymentStatus('idle'); }} className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mt-1">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // ── WEEK SELECTION VIEW ──
    if (quizState === 'select') {
        return (
            <>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30 border border-white/10">
                            🔵
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.3em] mb-1">Weekly Challenge</p>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Base Chain Quiz</h2>
                            <p className="text-sm text-muted-foreground font-medium mt-1">Complete each week to unlock the next • 10 Qs • 100 pts • 2 attempts</p>
                        </div>
                    </div>

                    {/* Week Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {WEEK_THEMES.map((theme) => {
                            const unlocked = isWeekUnlocked(theme.week, completedWeeks);
                            const active = isWeekActive(theme.week);
                            const bestScore = completedWeeks[theme.week];
                            const isCompleted = bestScore !== undefined;
                            const isPerfect = bestScore === 100;
                            const isTimeLocked = currentWeek < theme.week && (theme.week === 1 || completedWeeks[theme.week - 1] !== undefined);
                            const weekStart = getWeekStartDate(theme.week);
                            const weekAttempts = attempts[theme.week] || 0;
                            const daysLeft = active ? getDaysRemaining(theme.week) : 0;
                            const dateRange = formatWeekDates(theme.week);

                            return (
                                <motion.button
                                    key={theme.week}
                                    whileHover={unlocked ? { y: -2 } : {}}
                                    whileTap={unlocked ? { scale: 0.99 } : {}}
                                    onClick={() => unlocked && startQuiz(theme.week)}
                                    disabled={!unlocked}
                                    className={`glass-card p-5 text-left relative overflow-hidden group transition-all duration-300 ${
                                        !unlocked
                                            ? 'opacity-50 cursor-not-allowed grayscale-[30%]'
                                            : active
                                                ? 'border-blue-500/40 ring-2 ring-blue-500/20'
                                                : 'hover:border-blue-500/20'
                                    }`}
                                >
                                    {/* Lock overlay */}
                                    {!unlocked && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-2xl">
                                            <div className="flex flex-col items-center gap-1">
                                                <Lock className="w-6 h-6 text-muted-foreground" />
                                                {isTimeLocked ? (
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider tabular-nums">Unlocks in {getCountdown(weekStart)}</span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Complete Week {theme.week - 1}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Glow */}
                                    {active && <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 bg-blue-500/15" />}

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg transition-transform group-hover:scale-110 ${
                                            active ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' : 'bg-blue-500/10'
                                        }`}>
                                            {theme.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-extrabold text-blue-500 uppercase tracking-[0.2em]">Week {theme.week}</span>
                                                {active && <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-[8px] font-bold text-white uppercase tracking-wider animate-pulse">Live</span>}
                                                {isPerfect && <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[8px] font-bold text-white uppercase">Perfect</span>}
                                            </div>
                                            <h3 className="font-extrabold text-base tracking-tight text-foreground truncate">{theme.title}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground font-medium">{dateRange}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-center gap-1">
                                            {isCompleted ? (
                                                <>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isPerfect ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {bestScore}
                                                    </div>
                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Best</span>
                                                </>
                                            ) : unlocked ? (
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Attempt / Days info */}
                                    {unlocked && (
                                        <div className="flex items-center gap-4 mt-3 relative z-10">
                                            <span className="text-[9px] font-bold text-muted-foreground">
                                                {weekAttempts}/2 attempts used
                                            </span>
                                            {active && daysLeft > 0 && (
                                                <span className="text-[9px] font-bold text-blue-500">
                                                    {daysLeft}d remaining
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Progress bar */}
                                    {isCompleted && (
                                        <div className="mt-3 h-1 rounded-full bg-muted/50 overflow-hidden relative z-10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${bestScore}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className={`h-full rounded-full ${isPerfect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            />
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 py-4">
                        <div className="text-center">
                            <p className="text-2xl font-extrabold text-foreground">{Object.keys(completedWeeks).length}/10</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Completed</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <p className="text-2xl font-extrabold text-blue-500">{Object.values(completedWeeks).reduce((a, b) => a + b, 0)}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Score</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <p className="text-2xl font-extrabold text-foreground">1000</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Max Points</p>
                        </div>
                    </div>
                </motion.div>
                {renderPaymentModal()}
            </>
        );
    }

    // ── RESULT VIEW ──
    if (quizState === 'result') {
        const passed = score >= 70;
        const theme = selectedWeek ? WEEK_THEMES[selectedWeek - 1] : null;
        return (
            <>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center space-y-8 py-8">
                    <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl ${passed ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-red-500/30'}`}>
                        {passed ? '🏆' : '💪'}
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-blue-500">Week {selectedWeek} — {theme?.title}</p>
                        <h2 className={`text-3xl font-black tracking-tight ${passed ? 'text-emerald-500' : 'text-foreground'}`}>
                            {score === 100 ? 'Perfect Score!' : passed ? 'Excellent!' : 'Keep Learning!'}
                        </h2>
                    </div>
                    <div className="glass-card p-6 inline-flex items-center gap-8">
                        <div className="text-center">
                            <p className={`text-4xl font-black ${passed ? 'text-emerald-500' : 'text-orange-500'}`}>{score}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">/ 100 pts</p>
                        </div>
                        <div className="w-px h-12 bg-border" />
                        <div className="text-center">
                            <p className="text-4xl font-black text-blue-500">{score / 10}/{questions.length}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Correct</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => startQuiz(selectedWeek!)} className="px-8 py-3.5 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                            Retry Quiz
                        </button>
                        <button onClick={goBack} className="px-8 py-3.5 rounded-2xl bg-muted/50 border border-border text-foreground font-bold text-sm hover:bg-muted transition-colors">
                            All Weeks
                        </button>
                    </div>
                </motion.div>
                {renderPaymentModal()}
            </>
        );
    }

    // ── QUIZ IN PROGRESS ──
    if (!currentQuestion) return null;
    const isCorrect = selectedOpt === currentQuestion.answer;
    const theme = WEEK_THEMES[selectedWeek! - 1];

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <button onClick={goBack} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Week {selectedWeek}: {theme.title}</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <Zap className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-bold text-blue-500">{score} pts</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-2xl border border-border shadow-sm">
                            <Clock className={`w-3.5 h-3.5 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`} />
                            <span className={`text-xs font-bold tabular-nums ${timeLeft < 10 ? 'text-rose-500' : 'text-foreground'}`}>
                                00:{timeLeft.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="glass-card p-6 sm:p-8 space-y-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                                currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-500' :
                                currentQuestion.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                                {currentQuestion.difficulty}
                            </div>
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                            {currentQuestion.question}
                        </h3>

                        <div className="space-y-3">
                            {currentQuestion.options.map((opt, oi) => {
                                const isSelected = selectedOpt === opt;
                                const isAnswer = opt === currentQuestion.answer;
                                const showResult = selectedOpt !== null;
                                return (
                                    <motion.button
                                        key={oi}
                                        whileHover={!showResult ? { x: 2 } : {}}
                                        whileTap={!showResult ? { scale: 0.99 } : {}}
                                        onClick={() => handleAnswer(opt)}
                                        disabled={!!selectedOpt}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-3 ${showResult
                                            ? isAnswer
                                                ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                                                : isSelected
                                                    ? 'border-red-500 bg-red-500/10 text-foreground'
                                                    : 'border-transparent bg-muted/30 text-muted-foreground opacity-50'
                                            : 'border-border bg-muted/20 hover:border-blue-500/40 hover:bg-blue-500/5 text-foreground'
                                        }`}
                                    >
                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                            showResult && isAnswer ? 'bg-emerald-500 text-white' :
                                            showResult && isSelected ? 'bg-red-500 text-white' :
                                            'bg-muted/50 text-muted-foreground'
                                        }`}>
                                            {String.fromCharCode(65 + oi)}
                                        </span>
                                        <span className="flex-1 text-sm font-semibold">{opt}</span>
                                        {showResult && isAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                                        {showResult && isSelected && !isAnswer && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        <AnimatePresence>
                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`p-4 rounded-2xl border text-sm leading-relaxed font-medium ${isCorrect
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-foreground'
                                        : 'bg-orange-500/5 border-orange-500/20 text-foreground'
                                    }`}>
                                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.2em] mb-2 ${isCorrect ? 'text-emerald-500' : 'text-orange-500'}`}>
                                            {isCorrect ? '✅ Correct! +10 pts' : '❌ Not Quite'}
                                        </p>
                                        <p className="text-foreground/80">{currentQuestion.explanation}</p>
                                    </div>
                                    <button
                                        onClick={handleNext}
                                        className="mt-4 w-full py-3.5 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {currentIdx === questions.length - 1 ? 'View Results' : 'Next Question'}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
            {renderPaymentModal()}
        </>
    );
};
