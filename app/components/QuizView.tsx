"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, BookOpen } from 'lucide-react';
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
}

export const QuizView = ({
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedOption,
    onSelectOption,
    showExplanation,
    onNext,
    isLastQuestion
}: QuizViewProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto space-y-8"
        >
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black">
                        {currentQuestionIndex + 1}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question</p>
                        <p className="text-xs font-bold text-slate-400">Section {currentQuestionIndex + 1} of {totalQuestions}</p>
                    </div>
                </div>

                <div className="h-2 w-32 bg-slate-800/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                        className="h-full bg-primary"
                    />
                </div>
            </div>

            <div className="glass-card p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BookOpen className="w-24 h-24" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black leading-tight mb-10 relative z-10">
                    {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                    {currentQuestion.options.map((option, idx) => {
                        const isCorrect = option === currentQuestion.answer;
                        const isSelected = option === selectedOption;

                        let btnClass = "glass-card hover:bg-primary/5 border-transparent";
                        if (showExplanation) {
                            if (isCorrect) btnClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-500";
                            else if (isSelected) btnClass = "bg-rose-500/10 border-rose-500/50 text-rose-500 opacity-80";
                            else btnClass = "opacity-40 grayscale";
                        }

                        return (
                            <motion.button
                                key={idx}
                                whileHover={!showExplanation ? { x: 8, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' } : {}}
                                onClick={() => onSelectOption(option)}
                                disabled={!!selectedOption}
                                className={`w-full p-5 rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between group ${btnClass}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 ${isSelected ? 'bg-primary text-white border-primary' : 'border-slate-800/10'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {option}
                                </div>
                                {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showExplanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl border-2 ${selectedOption === currentQuestion.answer
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                    >
                        <div className="flex gap-4">
                            <div className={`p-2 rounded-xl shrink-0 ${selectedOption === currentQuestion.answer ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                                }`}>
                                {selectedOption === currentQuestion.answer
                                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    : <XCircle className="w-5 h-5 text-rose-500" />
                                }
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest opacity-50">Explanation</p>
                                <p className="text-sm font-medium leading-relaxed italic">{currentQuestion.explanation}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-end pt-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    disabled={!selectedOption}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLastQuestion ? 'Finish Attempt' : 'Next Question'}
                    <ArrowRight className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};
