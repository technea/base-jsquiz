"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Menu, X, Linkedin, Github, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#' },
    { name: 'Services', href: '#' },
    { name: 'Projects', href: '#' },
    { name: 'Contact Us', href: '#' },
  ];

  return (
    <nav className="relative w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-200">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">Furqan</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-sm font-semibold text-gray-600 hover:text-blue-500 transition-colors uppercase tracking-wider"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Button & Socials (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <button className="px-6 py-2.5 rounded-full border-2 border-blue-500 text-blue-600 font-bold text-sm hover:bg-blue-500 hover:text-white transition-all duration-300">
              Front End Developer
            </button>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.linkedin.com/in/furqan-safeer-691b71372/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                <Github className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-all focus:outline-none"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-8 flex flex-col items-center space-y-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full text-center"
                >
                  <Link 
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block w-full py-2 text-lg font-bold text-gray-800 hover:text-blue-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Separator */}
              <div className="w-16 h-px bg-gray-100 mx-auto my-2" />

              {/* Mobile Profile CTA */}
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[280px] py-4 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200"
              >
                Front End Developer
              </motion.button>

              {/* Mobile Socials */}
              <div className="flex items-center gap-8 pt-4">
                <a 
                  href="https://www.linkedin.com/in/furqan-safeer-691b71372/" 
                  className="p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <Linkedin className="w-8 h-8" />
                </a>
                <a 
                  href="#" 
                  className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                  <Github className="w-8 h-8" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
