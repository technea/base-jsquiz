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

            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 pt-16">
                {/* Brand Identity */}
                <div className="col-span-2 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-premium rounded-2xl shadow-xl shadow-primary/20">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter leading-none uppercase">
                                JAZZ<span className="text-primary italic">MINI</span>
                            </h2>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mt-1">The JS Blueprint</p>
                        </div>
                    </div>

                    <p className={`text-sm sm:text-base font-medium max-w-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Elevating technical expertise on Base. Master JavaScript fundamentals through immersive challenges and earn verifiable proof of your skills.
                    </p>

                    <div className="flex items-center gap-3">
                        {[
                            { icon: Twitter, href: "https://twitter.com/jazzmini" },
                            { icon: Github, href: "https://github.com/jazzmini" },
                            { icon: Mail, href: "mailto:hello@jazzmini.io" },
                            { icon: MessageSquare, href: "https://warpcast.com/jazzmini" }
                        ].map((social, i) => (
                            <motion.a
                                key={i}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.1, translateY: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-2.5 glass-card hover:border-primary/50 hover:text-primary transition-colors inline-block ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-black/5 border-black/10 text-slate-600'}`}
                            >
                                <social.icon className="w-4 h-4" />
                            </motion.a>
                        ))}
                    </div>
                </div>

                {/* Dynamic Links */}
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-6">
                        <h3 className={`text-xs font-black uppercase tracking-[0.2em] border-l-2 border-primary/40 pl-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {section.title}
                        </h3>
                        <nav className="flex flex-col gap-3">
                            {section.links.map((link, lIdx) => (
                                link.id ? (
                                    <button
                                        key={lIdx}
                                        onClick={() => setActiveTab(link.id as any)}
                                        className={`text-xs sm:text-sm font-bold uppercase tracking-widest text-left transition-all hover:text-primary group flex items-center gap-2 ${activeTab === link.id ? 'text-primary' : (isDarkMode ? 'text-slate-400' : 'text-slate-600')
                                            }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full bg-primary transition-all ${activeTab === link.id ? 'opacity-100' : 'opacity-0'}`} />
                                        {link.name}
                                    </button>
                                ) : (
                                    <a
                                        key={lIdx}
                                        href={link.href}
                                        className={`text-xs sm:text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1.5 group ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                                    >
                                        {link.name}
                                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                                    </a>
                                )
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            {/* Verification Footer */}
            <div className="mt-20 pt-10 border-t border-white/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 bg-primary/5">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-primary">Base Network Verified</span>
                        </div>
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                            © {currentYear} Jazzmini Lab <span className="mx-2 hidden sm:inline">|</span>
                            <span className="opacity-50"> Built with </span>
                            <Heart className="w-3 h-3 text-accent inline mx-0.5" />
                            <span className="opacity-50"> for the Base Community </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity cursor-default">
                            <span>Secured by</span>
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">B</div>
                            <span>Base L2</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
