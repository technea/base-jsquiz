"use client";

import { motion } from 'framer-motion';
import { Trophy, Github, Twitter, Heart, ShieldCheck, Mail, MessageSquare, ExternalLink } from 'lucide-react';

interface FooterProps {
    isDarkMode: boolean;
    activeTab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard';
    setActiveTab: (tab: 'quiz' | 'daily' | 'learn' | 'dashboard' | 'leaderboard') => void;
}

export const Footer = ({ isDarkMode, activeTab, setActiveTab }: FooterProps) => {
    const currentYear = new Date().getFullYear();

    const sections = [
        {
            title: "Ecosystem",
            links: [
                { name: "Technical Quiz", id: "quiz" },
                { name: "Daily Arena", id: "daily" },
                { name: "Learning Hub", id: "learn" },
                { name: "Rankings", id: "leaderboard" },
            ]
        },
        {
            title: "Support",
            links: [
                { name: "Documentation", href: "#" },
                { name: "Bug Bounty", href: "#" },
                { name: "Feedback", href: "#" },
                { name: "Contact Us", href: "mailto:support@jazzmini.io" },
            ]
        },
        {
            title: "On-Chain",
            links: [
                { name: "Base Scan", href: "https://basescan.org" },
                { name: "Contract", href: "https://basescan.org/address/0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5" },
                { name: "Verify Skills", href: "#" },
                { name: "Rewards Hub", href: "#" },
            ]
        }
    ];

    return (
        <footer className="mt-24 sm:mt-32 pb-12 relative overflow-hidden">
            {/* Decorative Ambient Light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="pt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16">
                {/* Brand Identity - Focused */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-8 flex flex-col items-center xl:items-start text-center xl:text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-premium rounded-2xl shadow-xl shadow-primary/20">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black tracking-tighter leading-none uppercase text-foreground">
                                JAZZ<span className="text-primary italic">MINI</span>
                            </h2>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mt-1">The JS Blueprint</p>
                        </div>
                    </div>

                    <p className={`text-sm sm:text-base font-medium max-w-md leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Elevating technical expertise on Base. Master JavaScript fundamentals through immersive challenges and earn verifiable proof of your skills.
                    </p>
                </div>

                {/* Sections Grid */}
                <div className="lg:col-span-12 xl:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-6">
                            <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{section.title}</h4>
                            <ul className="space-y-4">
                                {section.links.map((link, lIdx) => (
                                    <li key={lIdx}>
                                        {'id' in link ? (
                                            <button
                                                onClick={() => {
                                                    setActiveTab(link.id as any);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className={`text-sm font-bold transition-all hover:text-primary ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                {link.name}
                                            </button>
                                        ) : (
                                            <a
                                                href={link.href}
                                                target={link.href.startsWith('http') ? "_blank" : undefined}
                                                rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                                                className={`text-sm font-bold flex items-center gap-1 transition-all hover:text-primary ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                {link.name}
                                                {link.href.startsWith('http') && <ExternalLink className="w-3 h-3 opacity-50" />}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Verification Footer */}
            <div className="mt-20 pt-10 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 bg-primary/5">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary">Base Network Verified</span>
                        </div>
                        <div className="space-y-1 md:space-y-0">
                            <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                © {currentYear} Jazzmini Lab <span className="mx-2 hidden md:inline">|</span>
                                <span className="opacity-50"> Built with </span>
                                <Heart className="w-3 h-3 text-accent inline mx-0.5" />
                                <span className="opacity-50"> for the Base Community </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pb-8 md:pb-0">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity cursor-default">
                            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Secured by</span>
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">B</div>
                            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Base L2</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
