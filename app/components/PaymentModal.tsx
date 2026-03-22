"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Wallet, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glass-card relative w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 shadow-2xl overflow-hidden"
                    >
                        {/* Status Brand Layer */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none uppercase text-foreground font-black text-6xl tracking-tighter italic">Lvl {level}</div>

                        <div className="text-center space-y-6 relative z-10">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 5 }}
                                className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20"
                            >
                                <Lock className="w-10 h-10 text-white" />
                            </motion.div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.4rem] text-primary/80">Assessment Gateway</p>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight italic">
                                    Curriculum Restricted
                                </h2>
                                <p className="text-muted-foreground font-medium text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                                    Maximum attempts reached. Re-initialize access with a one-time verification.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-[1.5rem] bg-muted/50 border border-border/60 space-y-4 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                            
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-muted-foreground font-extrabold uppercase tracking-widest text-[9px]">Module</span>
                                <span className="text-foreground font-extrabold text-[13px] uppercase">Lvl {level} PERMIT</span>
                            </div>
                            
                            <div className="flex justify-between items-end relative z-10">
                                <span className="text-muted-foreground font-extrabold uppercase tracking-widest text-[9px]">Verification Fee</span>
                                <div className="text-right">
                                    <span className="text-xl font-extrabold text-foreground tracking-tighter italic mr-1">$0.05</span>
                                    <span className="text-[10px] font-black text-primary uppercase">USDC</span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border/40" />
                            
                            <div className="text-[9px] text-muted-foreground font-bold leading-relaxed flex items-start gap-2 italic opacity-70">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                                <span>Verifiable on Base Mainnet. Access is anchored to your wallet.</span>
                            </div>
                        </div>

                        {paymentStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
                            >
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-rose-500 font-extrabold uppercase tracking-tight leading-relaxed">{paymentError}</p>
                            </motion.div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={onUnlock}
                                disabled={paymentStatus === 'pending' || paymentStatus === 'success'}
                                className="btn-premium w-full py-3.5 rounded-xl font-extrabold text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all"
                            >
                                {paymentStatus === 'pending' ? (
                                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                                ) : paymentStatus === 'success' ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>PERMIT GRANTED</span>
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4" />
                                        <span>Authorize $0.05 USDC</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                className="text-[10px] font-extrabold uppercase tracking-[0.3em] py-2 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 group mx-auto"
                            >
                                Return to Interface Hub
                                <div className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
