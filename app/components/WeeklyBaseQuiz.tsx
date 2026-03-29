"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, XCircle, Trophy, ArrowLeft, Zap, Star, Clock, BookOpen, Wallet, RefreshCw, Lock } from 'lucide-react';
import { BASE_QUIZ_DATA, WEEK_THEMES, getCurrentWeek, getQuizByWeek, BaseQuizQuestion } from '../baseQuizData';

interface WeeklyBaseQuizProps {
    isDarkMode: boolean;
    onPayment: (amount: number) => Promise<any>;
}

export const WeeklyBaseQuiz = ({ isDarkMode, onPayment }: WeeklyBaseQuizProps) => {
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [quizState, setQuizState] = useState<'select' | 'in_progress' | 'result'>('select');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    
    const [completedWeeks, setCompletedWeeks] = useState<Record<number, number>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            return JSON.parse(localStorage.getItem('baseQuizCompleted') || '{}');
        } catch { return {}; }
    });
    
    const [attempts, setAttempts] = useState<Record<number, number>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            return JSON.parse(localStorage.getItem('baseQuizAttempts') || '{}');
        } catch { return {}; }
    });
    
    const [paidWeeks, setPaidWeeks] = useState<Record<number, boolean>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            return JSON.parse(localStorage.getItem('baseQuizPaid') || '{}');
        } catch { return {}; }
    });

    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [showPayment, setShowPayment] = useState(false);
    const [pendingWeek, setPendingWeek] = useState<number | null>(null);

    const currentWeek = getCurrentWeek();
    const questions = selectedWeek ? getQuizByWeek(selectedWeek) : [];
    const currentQuestion = questions[currentIdx];

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
    }, [attempts, paidWeeks]);

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

    const handleNext = useCallback(() => {
        if (currentIdx === questions.length - 1) {
            const finalScore = selectedOpt === currentQuestion.answer ? score + 10 : score;
            const actualScore = selectedOpt === currentQuestion.answer ? finalScore : score;
            setQuizState('result');

            // Increment attempts
            const newAttempts = { ...attempts, [selectedWeek!]: (attempts[selectedWeek!] || 0) + 1 };
            setAttempts(newAttempts);
            localStorage.setItem('baseQuizAttempts', JSON.stringify(newAttempts));

            if (selectedWeek) {
                const best = Math.max(completedWeeks[selectedWeek] || 0, actualScore);
                const updated = { ...completedWeeks, [selectedWeek]: best };
                setCompletedWeeks(updated);
                localStorage.setItem('baseQuizCompleted', JSON.stringify(updated));
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

    const renderPaymentModal = () => (
        <AnimatePresence>
            {showPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-foreground">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPayment(false)}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-card relative w-full max-w-md p-8 space-y-8 shadow-2xl overflow-hidden border border-border/50"
                    >
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-blue-500/10 rounded-3xl flex items-center justify-center">
                                <Lock className="w-10 h-10 text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight italic">
                                    Access Restricted
                                </h2>
                                <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                                    You've used your 2 free attempts for this week. 
                                    Unlock unlimited retries for $0.03 USDC.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-muted/50 border border-border/60">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-opacity-60">Verification Fee</span>
                                <div className="text-right">
                                    <span className="text-xl font-black italic mr-1">$0.03</span>
                                    <span className="text-[10px] font-bold text-blue-500 uppercase">USDC</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleUnlock}
                            disabled={paymentStatus === 'pending'}
                            className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all hover:bg-blue-700 disabled:opacity-50"
                        >
                            {paymentStatus === 'pending' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                            {paymentStatus === 'pending' ? 'Processing...' : 'Unlock Week Access'}
                        </button>

                        <button
                            onClick={() => setShowPayment(false)}
                            className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Maybe Later
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (quizState === 'select') {
        return (
            <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-[2rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30 border border-white/10">
                        🔵
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.3em] mb-1">Weekly Challenge</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Base Chain Quiz</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-1">10 weekly quizzes to master the Base ecosystem</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {WEEK_THEMES.map((theme) => {
                        const isCurrentWeek = theme.week === currentWeek;
                        const bestScore = completedWeeks[theme.week];
                        const isCompleted = bestScore !== undefined;

                        return (
                            <motion.button
                                key={theme.week}
                                whileHover={{ y: -4, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => startQuiz(theme.week)}
                                className={`glass-card p-5 text-left relative overflow-hidden group transition-all duration-300 ${isCurrentWeek ? 'border-blue-500/40' : ''}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-blue-500/10">
                                        {theme.emoji}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[9px] font-extrabold text-blue-500 uppercase">Week {theme.week}</span>
                                        <h3 className="font-extrabold text-base text-foreground">{theme.title}</h3>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
            {renderPaymentModal()}
            </>
        );
    }

    if (quizState === 'result') {
        const passed = score >= 70;
        return (
            <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center space-y-8 py-8">
                <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center text-5xl ${passed ? 'bg-emerald-500' : 'bg-orange-500 shadow-2xl'}`}>
                    {passed ? '🏆' : '💪'}
                </div>
                <h2 className="text-3xl font-black text-foreground">{passed ? 'Excellent!' : 'Keep Learning!'}</h2>
                <div className="flex justify-center gap-4">
                    <button onClick={() => startQuiz(selectedWeek!)} className="px-8 py-3.5 rounded-2xl bg-blue-500 text-white font-bold">Retry Quiz</button>
                    <button onClick={goBack} className="px-8 py-3.5 rounded-2xl bg-muted text-foreground font-bold">All Weeks</button>
                </div>
            </motion.div>
            {renderPaymentModal()}
            </>
        );
    }

    if (!currentQuestion) return null;
    const isCorrect = selectedOpt === currentQuestion.answer;
    
    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={goBack} className="text-sm font-bold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-2xl border border-border shadow-sm">
                        <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-blue-500'}`} />
                        <span className={`text-xs font-bold ${timeLeft < 10 ? 'text-rose-500' : 'text-foreground'}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-extrabold text-foreground">{currentQuestion.question}</h3>
                <div className="space-y-3">
                    {currentQuestion.options.map((opt, oi) => (
                        <button
                            key={oi}
                            onClick={() => handleAnswer(opt)}
                            disabled={!!selectedOpt}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                selectedOpt === opt ? (opt === currentQuestion.answer ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10') : 'border-border'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                {showExplanation && (
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-sm">
                        <p className="font-bold text-blue-500 mb-1">Explanation</p>
                        <p className="text-foreground/80">{currentQuestion.explanation}</p>
                        <button onClick={handleNext} className="mt-4 w-full py-3 bg-blue-500 text-white rounded-xl font-bold">
                            {currentIdx === questions.length - 1 ? 'View Results' : 'Next Question'}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
        {renderPaymentModal()}
        </>
    );
};
