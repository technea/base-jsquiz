"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift, Star, X, Loader2, ArrowRight } from 'lucide-react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { NFT_ABI, NFT_CONTRACT_ADDRESS } from '../nftABI';

interface NFTModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    userLevel: number;
    userStreak: number;
    userWeeksBase: number;
}

export const NFTModal = ({ isOpen, onClose, isDarkMode, userLevel, userStreak, userWeeksBase }: NFTModalProps) => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    
    const [claiming, setClaiming] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const handleClaim = async (type: 'level8' | 'weekly' | 'gm') => {
        setClaiming(type);
        setTxHash(null);
        try {
            const functionName = type === 'level8' ? 'claimLevel10Reward' : 
                                 type === 'weekly' ? 'claimWeeklyReward' : 'claimGMReward';
            
            const hash = await writeContractAsync({
                address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                abi: NFT_ABI,
                functionName,
                value: parseEther('0.000042'), // $0.10 fee
            });
            setTxHash(hash);
        } catch (error) {
            console.error("Mint failed:", error);
        } finally {
            setClaiming(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-[2.5rem] p-6 sm:p-8 shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                            <Gift className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Reward Vault</h2>
                        <p className="text-muted-foreground mt-2 font-medium">Claim your exclusive 3D NFTs to prove your skills on-chain.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Level 8 Reward */}
                        <div className="glass-card p-5 flex flex-col sm:flex-row items-center gap-4 text-left border-warning/20 bg-warning/5">
                            <div className="p-4 rounded-2xl bg-warning/20 text-warning">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-foreground">Javascript Master</h3>
                                <p className="text-sm text-muted-foreground">Reach Level 8 to unlock this Legendary Gold NFT.</p>
                                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-warning">
                                    Status: {userLevel >= 8 ? 'Unlocked' : `Level ${userLevel}/8`}
                                </div>
                            </div>
                            <button
                                onClick={() => handleClaim('level8')}
                                disabled={userLevel < 8 || claiming === 'level8'}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    userLevel >= 8 ? 'bg-warning text-warning-foreground hover:opacity-90' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {claiming === 'level8' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mint ($0.10)'}
                            </button>
                        </div>

                        {/* Weekly Base Reward */}
                        <div className="glass-card p-5 flex flex-col sm:flex-row items-center gap-4 text-left border-blue-500/20 bg-blue-500/5">
                            <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-500">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-foreground">Base Builder</h3>
                                <p className="text-sm text-muted-foreground">Complete 5 Weekly Quizzes on Base to claim this Rare Silver NFT.</p>
                                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-blue-500">
                                    Status: {userWeeksBase >= 5 ? 'Unlocked' : `Weeks ${userWeeksBase}/5`}
                                </div>
                            </div>
                            <button
                                onClick={() => handleClaim('weekly')}
                                disabled={userWeeksBase < 5 || claiming === 'weekly'}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    userWeeksBase >= 5 ? 'bg-blue-500 text-white hover:opacity-90' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {claiming === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mint ($0.10)'}
                            </button>
                        </div>

                        {/* GM Streak Reward */}
                        <div className="glass-card p-5 flex flex-col sm:flex-row items-center gap-4 text-left border-primary/20 bg-primary/5">
                            <div className="p-4 rounded-2xl bg-primary/20 text-primary">
                                <Star className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-foreground">Daily Developer</h3>
                                <p className="text-sm text-muted-foreground">Maintain a 7-day GM streak to claim this Epic Diamond NFT.</p>
                                <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                                    Status: {userStreak >= 7 ? 'Unlocked' : `Streak ${userStreak}/7`}
                                </div>
                            </div>
                            <button
                                onClick={() => handleClaim('gm')}
                                disabled={userStreak < 7 || claiming === 'gm'}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    userStreak >= 7 ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {claiming === 'gm' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mint ($0.10)'}
                            </button>
                        </div>
                    </div>

                    {txHash && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm text-center font-medium">
                            Transaction submitted successfully! <br/>
                            <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline font-bold">View on Explorer</a>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
