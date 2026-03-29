"use client";

import { motion } from 'framer-motion';
import { Trophy, Github, Twitter, Heart, ShieldCheck, Mail, MessageSquare, ExternalLink } from 'lucide-react';

interface FooterProps {
    isDarkMode: boolean;
    activeTab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'base';
    setActiveTab: (tab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard' | 'base') => void;
}

export const Footer = ({ isDarkMode, activeTab, setActiveTab }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-32 pb-16 relative overflow-hidden px-6 max-w-7xl mx-auto w-full">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Bottom Bar Section */}
            <div className="pt-12">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                    
                    {/* Brand & Social Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-card bg-primary/5 border-primary/10 shadow-xl shadow-primary/5 group hover:border-primary/30 transition-all duration-300">
                            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] leading-none mb-1">Authenticated</p>
                                <p className="text-sm font-bold text-foreground">Base Network Protocol</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                © {currentYear} Jazzmini Lab. <span className="hidden md:inline mx-1.5 opacity-50">|</span>
                                <span className="opacity-70 whitespace-nowrap">
                                    Crafted with 
                                    <motion.span
                                        animate={{ scale: [1, 1.25, 1], color: ['#f43f5e', '#fb7185', '#f43f5e'] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="inline-block mx-1"
                                    >
                                        <Heart className="w-3.5 h-3.5 fill-current" />
                                    </motion.span>
                                     for <span className="font-bold text-foreground">Base Community</span>
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Security & Infrastructure Section */}
                    <div className="flex items-center gap-10 opacity-70 hover:opacity-100 transition-all group">
                        <div className="h-10 w-px bg-border hidden lg:block" />
                        
                        <div className="flex items-center gap-4 cursor-default">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest leading-none mb-1">Architecture</p>
                                <p className="text-xs font-bold text-foreground">Base L2 Secondary</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-xl shadow-2xl shadow-foreground/10 group-hover:scale-110 transition-transform duration-500">
                                B
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest leading-none mb-1">Security</p>
                                <p className="text-xs font-bold text-foreground">On-Chain Verified</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtle Legal/Technical Footer */}
                <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 pt-6 border-t border-border/40">
                    <a href="#" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Whitepaper</a>
                    <a href="#" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Terms of Service</a>
                    <a href="mailto:support@jazzmini.io" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1.5">
                        <Mail className="w-2.5 h-2.5" /> Technical Support
                    </a>
                </div>
            </div>
        </footer>
    );
};
