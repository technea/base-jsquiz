"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Wallet, RefreshCw, XCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    paymentStatus: 'idle' | 'pending' | 'success' | 'error';
    paymentError: string | null;
    onUnlock: () => void;
}

export const PaymentModal = ({
    isOpen,
    onClose,
    level,
    paymentStatus,
    paymentError,
    onUnlock
}: PaymentModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md bg-slate-900 border-2 border-primary/30 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-3xl flex items-center justify-center">
                                <Lock className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Level {level} Locked</h2>
                            <p className="text-slate-400 text-sm font-medium">
                                You've used all free attempts for Level {level}. Unlock unlimited attempts with a one-time support payment.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Item</span>
                                <span className="text-white font-black text-xs">Level {level} Master Unlock</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Price</span>
                                <span className="text-primary font-black text-xl italic">$0.05 USDC</span>
                            </div>
                            <div className="w-full h-px bg-white/10" />
                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                * Payment is sent on Base Mainnet. Verification is instantaneous.
                            </div>
                        </div>

                        {paymentStatus === 'error' && (
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-4">
                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-rose-500 font-bold leading-relaxed">{paymentError}</p>
                            </div>
                        )}

                        {paymentStatus === 'success' && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-emerald-500 font-bold leading-relaxed">Level unlocked! Starting session...</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onUnlock}
                                disabled={paymentStatus === 'pending' || paymentStatus === 'success'}
                                className={`w-full py-5 rounded-2xl text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all ${paymentStatus === 'pending'
                                        ? 'bg-primary/50 cursor-not-allowed opacity-50'
                                        : 'bg-primary hover:bg-primary/90 hover:shadow-primary/30'
                                    }`}
                            >
                                {paymentStatus === 'pending' ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5" />
                                        Unlock with $0.05 USDC
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                className="text-xs font-bold uppercase tracking-widest py-2 text-slate-500 hover:text-white transition-colors"
                            >
                                Back to Selection
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Secured by Base Blockchain</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
