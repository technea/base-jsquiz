"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
    currentQuestion: QuizQuestion;
    currentQuestionIndex: number;
    totalQuestions: number;
    selectedOption: string | null;
    onSelectOption: (option: string) => void;
    showExplanation: boolean;
    onNext: () => void;
    isLastQuestion: boolean;
    isDarkMode: boolean;
}

export const QuizView = ({
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedOption,
    onSelectOption,
    showExplanation,
    onNext,
    isLastQuestion,
    isDarkMode
}: QuizViewProps) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        setTimeLeft(30);
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (showExplanation || timeLeft === 0) {
            if (timeLeft === 0 && !selectedOption) {
                onSelectOption("TIME_EXPIRED"); // Special case for timeout
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, showExplanation, selectedOption, onSelectOption]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8 px-4 sm:px-6"
        >
            <div className="flex flex-col sm:flex-row justify-between items-center bg-muted/30 p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-border/50 gap-3">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-white rounded-xl sm:rounded-2xl flex items-center justify-center text-base sm:text-lg font-black shadow-lg shadow-primary/20">
                        {currentQuestionIndex + 1}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Active Session</p>
                        <p className="text-xs sm:text-sm font-bold text-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Timer UI */}
                    <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${timeLeft < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span className={`text-xs font-black tabular-nums ${timeLeft < 10 ? 'text-amber-500' : 'text-foreground'}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </span>
                    </div>

                    <div className="flex-1 sm:w-48 h-2 bg-background rounded-full overflow-hidden border border-border/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                            className="h-full bg-primary shadow-[0_0_10px_rgba(0,82,255,0.4)]"
                        />
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl sm:rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] bg-background/50 border-border/40 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-[0.03] select-none pointer-events-none">
                        <BookOpen className="w-24 h-24 sm:w-48 sm:h-48" />
                    </div>

                    <h3 className="text-xl sm:text-3xl font-black leading-tight text-foreground tracking-tight mb-6 sm:mb-8 relative z-10">
                        {currentQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-3 relative z-10">
                        {currentQuestion.options.map((option, idx) => {
                            const isCorrect = option === currentQuestion.answer;
                            const isSelected = option === selectedOption;
                            const isTimedOut = selectedOption === "TIME_EXPIRED";

                            let btnStyle = "bg-muted/30 border-border/50 hover:border-primary/50 text-foreground";
                            if (showExplanation) {
                                if (isCorrect) btnStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]";
                                else if (isSelected) btnStyle = "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]";
                                else btnStyle = "opacity-40 grayscale blur-[0.5px] border-transparent scale-[0.98]";
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={!showExplanation ? { y: -2, scale: 1.01, backgroundColor: isDarkMode ? 'rgba(0, 82, 255, 0.05)' : 'rgba(0, 82, 255, 0.03)' } : {}}
                                    onClick={() => onSelectOption(option)}
                                    disabled={!!selectedOption}
                                    className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group relative overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-5 w-full relative z-10">
                                        <span className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${isSelected
                                            ? 'bg-primary border-primary text-white shadow-lg'
                                            : 'border-border bg-background/50 text-muted-foreground'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 break-words text-sm sm:text-lg leading-snug">
                                            {option}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />}
                                        {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 shrink-0" />}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 shadow-2xl relative overflow-hidden ${selectedOption === currentQuestion.answer
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : selectedOption === "TIME_EXPIRED"
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                    >
                        <div className="flex gap-4 sm:gap-6 relative z-10">
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center ${selectedOption === currentQuestion.answer
                                ? 'bg-emerald-500/10'
                                : selectedOption === "TIME_EXPIRED"
                                    ? 'bg-amber-500/10'
                                    : 'bg-rose-500/10'
                                }`}>
                                {selectedOption === currentQuestion.answer
                                    ? <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                                    : selectedOption === "TIME_EXPIRED"
                                        ? <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                                        : <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500" />
                                }
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                    {selectedOption === "TIME_EXPIRED" ? "TIME'S UP!" : "Deep Dive Insight"}
                                </p>
                                <p className="text-sm sm:text-lg font-bold leading-relaxed italic text-foreground">
                                    {selectedOption === "TIME_EXPIRED"
                                        ? "Speed matters! You ran out of time for this challenge. Correct answer was highlighted."
                                        : currentQuestion.explanation}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-4">
                <button
                    onClick={() => window.location.reload()}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all order-2 sm:order-1"
                >
                    Terminate Session
                </button>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    disabled={!selectedOption}
                    className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-primary text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 sm:gap-4 shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed group order-1 sm:order-2"
                >
                    {isLastQuestion ? 'Complete Assessment' : 'Next Challenge'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </motion.div>
    );
};
