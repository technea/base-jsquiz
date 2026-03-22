"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
    currentQuestion: QuizQuestion;
    currentQuestionIndex: number;
    totalQuestions: number;
    selectedOption: string | null;
    onSelectOption: (option: string) => void;
    showExplanation: boolean;
    onNext: () => void;
    onClose: () => void;
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
    onClose,
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
                onSelectOption("TIME_EXPIRED");
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8 sm:pb-12 px-3 sm:px-4"
        >
            {/* Session Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center glass p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] gap-3 sm:gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-lg font-extrabold shadow-lg shadow-primary/20">
                        {currentQuestionIndex + 1}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Challenge Progress</p>
                        <p className="text-sm font-bold text-foreground opacity-80">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden border border-border/50 hidden sm:block">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                            className="h-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-background/50 px-4 py-2 rounded-2xl border border-border shadow-sm">
                        <Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-error animate-pulse' : 'text-primary'}`} />
                        <span className={`text-sm font-bold tabular-nums ${timeLeft < 10 ? 'text-error' : 'text-foreground'}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Question Card */}
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-12" />
                <div className="relative glass-card p-5 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-opacity-40 border-border/40 overflow-hidden">
                    <div className="absolute -top-6 -right-6 opacity-[0.05] pointer-events-none">
                        <BookOpen className="w-32 h-32 sm:w-48 sm:h-48" />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold leading-tight text-foreground tracking-tight mb-8 sm:mb-10 relative z-10">
                        {currentQuestion.question}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 relative z-10">
                        {currentQuestion.options.map((option, idx) => {
                            const isCorrect = option === currentQuestion.answer;
                            const isSelected = option === selectedOption;
                            
                            let btnStyle = "bg-background/40 border-border hover:border-primary/40 hover:bg-background/60";
                            let iconColor = "text-muted-foreground";

                            if (showExplanation) {
                                if (isCorrect) {
                                    btnStyle = "bg-success/5 border-success/30 text-success shadow-[0_0_40px_rgba(16,185,129,0.08)] ring-1 ring-success/10";
                                    iconColor = "text-success";
                                } else if (isSelected) {
                                    btnStyle = "bg-error/5 border-error/30 text-error shadow-[0_0_40px_rgba(244,63,94,0.08)] ring-1 ring-error/10";
                                    iconColor = "text-error";
                                } else {
                                    btnStyle = "opacity-30 grayscale-[50%] blur-[0.3px] border-transparent scale-[0.98]";
                                }
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={!showExplanation ? { x: 8 } : {}}
                                    onClick={() => onSelectOption(option)}
                                    disabled={!!selectedOption}
                                    className={`w-full p-3.5 sm:p-5 rounded-xl sm:rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group relative overflow-hidden ${btnStyle}`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6 w-full relative z-10">
                                        <span className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center text-xs font-extrabold border-2 transition-all ${
                                            isSelected
                                                ? 'bg-primary border-primary text-white shadow-lg'
                                                : 'border-border/60 bg-white/5 text-muted-foreground group-hover:bg-primary/5 group-hover:border-primary/20'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 break-words text-sm sm:text-lg font-bold tracking-tight">
                                            {option}
                                        </span>
                                    </div>
                                    <div className="relative z-10">
                                        {showExplanation && (isCorrect || isSelected) && (
                                            isCorrect ? <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Explanation Section */}
            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 sm:p-10 rounded-[2.5rem] border-2 shadow-2xl relative overflow-hidden backdrop-blur-md ${
                            selectedOption === currentQuestion.answer
                                ? 'bg-success/5 border-success/20'
                                : 'bg-primary/5 border-primary/20'
                        }`}
                    >
                        <div className="flex gap-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                                selectedOption === currentQuestion.answer ? 'bg-success/10' : 'bg-primary/10'
                            }`}>
                                {selectedOption === currentQuestion.answer
                                    ? <CheckCircle className="w-8 h-8 text-success" />
                                    : <Sparkles className="w-8 h-8 text-primary" />
                                }
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Insider Insight</p>
                                <p className="text-sm sm:text-base font-medium leading-relaxed text-foreground opacity-90">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-6">
                <button
                    onClick={() => window.location.reload()}
                    className="text-[10px] sm:text-xs font-bold text-muted-foreground hover:text-error transition-colors order-2 sm:order-1 flex items-center gap-2"
                >
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Terminate Session
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onNext}
                    disabled={!selectedOption}
                    className="w-full sm:w-auto px-8 py-3.5 btn-premium rounded-2xl text-[13px] font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 group order-1 sm:order-2"
                >
                    {isLastQuestion ? 'Complete Level' : 'Next Question'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </motion.div>
    );
};

