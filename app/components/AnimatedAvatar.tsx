"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface AnimatedAvatarProps {
    size?: number;
    isSpeaking?: boolean;
    mood?: 'happy' | 'thinking' | 'excited' | 'waving';
    onClick?: () => void;
    className?: string;
}

export const AnimatedAvatar = ({
    size = 200,
    isSpeaking = false,
    mood = 'happy',
    onClick,
    className = ''
}: AnimatedAvatarProps) => {
    const [isBlinking, setIsBlinking] = useState(false);
    const [eyeDirection, setEyeDirection] = useState({ x: 0, y: 0 });
    const [interactionBurst, setInteractionBurst] = useState(false);

    // Natural blinking
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
        }, Math.random() * 3000 + 2000);
        return () => clearInterval(blinkInterval);
    }, []);

    // Random eye movement
    useEffect(() => {
        const eyeInterval = setInterval(() => {
            setEyeDirection({
                x: (Math.random() - 0.5) * 6,
                y: (Math.random() - 0.5) * 4
            });
            setTimeout(() => setEyeDirection({ x: 0, y: 0 }), 800);
        }, 3500);
        return () => clearInterval(eyeInterval);
    }, []);

    const handleClick = useCallback(() => {
        setInteractionBurst(true);
        setTimeout(() => setInteractionBurst(false), 1000);
        onClick?.();
    }, [onClick]);

    const s = size;
    const headSize = s * 0.7;
    const bodyHeight = s * 0.35;

    return (
        <motion.div
            className={`relative cursor-pointer select-none ${className}`}
            style={{ width: s, height: s + bodyHeight * 0.3 }}
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* ═══ AMBIENT GLOW ═══ */}
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.15, 0.35, 0.15]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute rounded-full blur-[40px]"
                style={{
                    width: s * 1.2,
                    height: s * 1.2,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -55%)',
                    background: 'radial-gradient(circle, rgba(0,194,255,0.4) 0%, rgba(0,82,255,0.2) 50%, transparent 70%)'
                }}
            />

            {/* ═══ INTERACTION BURST PARTICLES ═══ */}
            <AnimatePresence>
                {interactionBurst && (
                    <>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={`burst-${i}`}
                                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                                animate={{
                                    scale: [0, 1.5, 0],
                                    x: Math.cos((i / 8) * Math.PI * 2) * s * 0.6,
                                    y: Math.sin((i / 8) * Math.PI * 2) * s * 0.6,
                                    opacity: [1, 0.8, 0]
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="absolute z-50 pointer-events-none"
                                style={{
                                    left: '50%',
                                    top: '40%',
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: i % 2 === 0
                                        ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                        : 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>

            {/* ═══ FLOATING BODY ═══ */}
            <motion.div
                animate={{
                    y: [0, -10, 0],
                    rotate: mood === 'waving' ? [0, 3, -3, 0] : [0, 1, -1, 0]
                }}
                transition={{
                    y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: mood === 'waving' ? 1.5 : 6, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="relative"
            >
                {/* ═══ ANTENNA ═══ */}
                <motion.div
                    animate={{
                        rotate: [0, 15, -15, 0],
                        scale: mood === 'excited' ? [1, 1.3, 1] : 1
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute z-20"
                    style={{
                        left: '50%',
                        top: -s * 0.08,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {/* Antenna Stem */}
                    <div
                        className="mx-auto rounded-full"
                        style={{
                            width: 3,
                            height: s * 0.1,
                            background: 'linear-gradient(to top, #3b82f6, #60a5fa)'
                        }}
                    />
                    {/* Antenna Ball */}
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 8px 2px rgba(96,165,250,0.4)',
                                '0 0 20px 6px rgba(96,165,250,0.8)',
                                '0 0 8px 2px rgba(96,165,250,0.4)'
                            ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="mx-auto rounded-full"
                        style={{
                            width: s * 0.06,
                            height: s * 0.06,
                            background: 'radial-gradient(circle, #93c5fd, #3b82f6)',
                            marginTop: -2
                        }}
                    />
                </motion.div>

                {/* ═══ EARS / SIDE ACCENTS ═══ */}
                <motion.div
                    animate={{ scaleX: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute rounded-lg z-0"
                    style={{
                        left: -s * 0.06,
                        top: headSize * 0.35,
                        width: s * 0.08,
                        height: s * 0.12,
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        borderRadius: s * 0.03
                    }}
                />
                <motion.div
                    animate={{ scaleX: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute rounded-lg z-0"
                    style={{
                        right: -s * 0.06,
                        top: headSize * 0.35,
                        width: s * 0.08,
                        height: s * 0.12,
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        borderRadius: s * 0.03
                    }}
                />

                {/* ═══ HEAD ═══ */}
                <motion.div
                    animate={mood === 'thinking' ? { rotate: [0, 5, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative mx-auto overflow-hidden z-10"
                    style={{
                        width: headSize,
                        height: headSize,
                        borderRadius: headSize * 0.38,
                        background: 'linear-gradient(145deg, #2563eb 0%, #1e40af 40%, #1e3a8a 100%)',
                        boxShadow: `
                            0 8px 32px rgba(37, 99, 235, 0.4),
                            inset 0 2px 8px rgba(255,255,255,0.1),
                            0 0 0 3px rgba(96,165,250,0.15)
                        `
                    }}
                >
                    {/* Face Visor / Screen */}
                    <div
                        className="absolute overflow-hidden"
                        style={{
                            top: headSize * 0.2,
                            left: headSize * 0.12,
                            width: headSize * 0.76,
                            height: headSize * 0.55,
                            borderRadius: headSize * 0.2,
                            background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
                            boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6), 0 0 0 2px rgba(96,165,250,0.2)',
                        }}
                    >
                        {/* Screen scanline effect */}
                        <motion.div
                            animate={{ y: ['-100%', '200%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 pointer-events-none opacity-[0.03]"
                            style={{
                                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
                                height: '50%'
                            }}
                        />

                        {/* ═══ EYES ═══ */}
                        <div
                            className="flex items-center justify-center gap-[15%]"
                            style={{
                                height: '60%',
                                paddingTop: headSize * 0.05
                            }}
                        >
                            {/* Left Eye */}
                            <motion.div
                                animate={{
                                    scaleY: isBlinking ? 0.1 : 1,
                                    x: eyeDirection.x,
                                    y: eyeDirection.y
                                }}
                                transition={{ scaleY: { duration: 0.1 }, x: { duration: 0.3 }, y: { duration: 0.3 } }}
                                style={{
                                    width: headSize * 0.16,
                                    height: headSize * 0.16,
                                    borderRadius: '50%',
                                    background: mood === 'excited'
                                        ? 'radial-gradient(circle, #fbbf24, #f59e0b)'
                                        : 'radial-gradient(circle, #67e8f9, #06b6d4)',
                                    boxShadow: mood === 'excited'
                                        ? '0 0 15px 4px rgba(251,191,36,0.5), 0 0 30px 8px rgba(251,191,36,0.2)'
                                        : '0 0 15px 4px rgba(103,232,249,0.5), 0 0 30px 8px rgba(103,232,249,0.2)'
                                }}
                            />
                            {/* Right Eye */}
                            <motion.div
                                animate={{
                                    scaleY: isBlinking ? 0.1 : 1,
                                    x: eyeDirection.x,
                                    y: eyeDirection.y
                                }}
                                transition={{ scaleY: { duration: 0.1 }, x: { duration: 0.3 }, y: { duration: 0.3 } }}
                                style={{
                                    width: headSize * 0.16,
                                    height: headSize * 0.16,
                                    borderRadius: '50%',
                                    background: mood === 'excited'
                                        ? 'radial-gradient(circle, #fbbf24, #f59e0b)'
                                        : 'radial-gradient(circle, #67e8f9, #06b6d4)',
                                    boxShadow: mood === 'excited'
                                        ? '0 0 15px 4px rgba(251,191,36,0.5), 0 0 30px 8px rgba(251,191,36,0.2)'
                                        : '0 0 15px 4px rgba(103,232,249,0.5), 0 0 30px 8px rgba(103,232,249,0.2)'
                                }}
                            />
                        </div>

                        {/* ═══ MOUTH ═══ */}
                        <div className="flex justify-center" style={{ marginTop: -headSize * 0.02 }}>
                            {isSpeaking ? (
                                /* Speaking Animation - Oscillating mouth */
                                <motion.div
                                    animate={{
                                        scaleY: [0.5, 1.2, 0.3, 1, 0.6, 1.4, 0.5],
                                        scaleX: [1, 0.8, 1.1, 0.9, 1, 0.85, 1],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                    style={{
                                        width: headSize * 0.15,
                                        height: headSize * 0.1,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #f472b6, #ec4899)',
                                        boxShadow: '0 0 10px rgba(244,114,182,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)'
                                    }}
                                />
                            ) : mood === 'happy' || mood === 'excited' ? (
                                /* Happy Smile */
                                <motion.div
                                    animate={mood === 'excited' ? { scaleX: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    style={{
                                        width: headSize * 0.2,
                                        height: headSize * 0.08,
                                        borderRadius: `0 0 ${headSize * 0.1}px ${headSize * 0.1}px`,
                                        background: 'linear-gradient(180deg, #f472b6, #ec4899)',
                                        boxShadow: '0 0 8px rgba(244,114,182,0.3)'
                                    }}
                                />
                            ) : (
                                /* Thinking - small circle */
                                <motion.div
                                    animate={{ scale: [1, 0.8, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{
                                        width: headSize * 0.08,
                                        height: headSize * 0.08,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, #f472b6, #ec4899)',
                                        boxShadow: '0 0 8px rgba(244,114,182,0.3)'
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Cheek blush */}
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute rounded-full"
                        style={{
                            width: headSize * 0.12,
                            height: headSize * 0.06,
                            bottom: headSize * 0.22,
                            left: headSize * 0.12,
                            background: 'rgba(244,114,182,0.3)',
                            filter: `blur(${headSize * 0.02}px)`
                        }}
                    />
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                        className="absolute rounded-full"
                        style={{
                            width: headSize * 0.12,
                            height: headSize * 0.06,
                            bottom: headSize * 0.22,
                            right: headSize * 0.12,
                            background: 'rgba(244,114,182,0.3)',
                            filter: `blur(${headSize * 0.02}px)`
                        }}
                    />

                    {/* Shine highlight */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            top: headSize * 0.05,
                            left: headSize * 0.2,
                            width: headSize * 0.3,
                            height: headSize * 0.15,
                            borderRadius: '50%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
                        }}
                    />
                </motion.div>

                {/* ═══ BODY ═══ */}
                <motion.div
                    className="mx-auto relative -mt-2 z-[5]"
                    style={{
                        width: headSize * 0.65,
                        height: bodyHeight * 0.6,
                        borderRadius: `0 0 ${headSize * 0.2}px ${headSize * 0.2}px`,
                        background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                        boxShadow: '0 8px 24px rgba(30, 64, 175, 0.3)'
                    }}
                >
                    {/* Chest Light / Core */}
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 8px 2px rgba(96,165,250,0.3)',
                                '0 0 20px 6px rgba(96,165,250,0.6)',
                                '0 0 8px 2px rgba(96,165,250,0.3)'
                            ],
                            background: isSpeaking
                                ? [
                                    'radial-gradient(circle, #93c5fd, #3b82f6)',
                                    'radial-gradient(circle, #fbbf24, #f59e0b)',
                                    'radial-gradient(circle, #93c5fd, #3b82f6)'
                                ]
                                : 'radial-gradient(circle, #93c5fd, #3b82f6)'
                        }}
                        transition={{ duration: isSpeaking ? 0.5 : 2, repeat: Infinity }}
                        className="absolute rounded-full"
                        style={{
                            width: headSize * 0.1,
                            height: headSize * 0.1,
                            top: bodyHeight * 0.15,
                            left: '50%',
                            transform: 'translateX(-50%)',
                        }}
                    />

                    {/* Body stripe accents */}
                    <div
                        className="absolute"
                        style={{
                            bottom: bodyHeight * 0.12,
                            left: '15%',
                            right: '15%',
                            height: 2,
                            background: 'rgba(96,165,250,0.2)',
                            borderRadius: 1
                        }}
                    />
                    <div
                        className="absolute"
                        style={{
                            bottom: bodyHeight * 0.22,
                            left: '20%',
                            right: '20%',
                            height: 2,
                            background: 'rgba(96,165,250,0.15)',
                            borderRadius: 1
                        }}
                    />
                </motion.div>

                {/* ═══ WAVING ARM (when mood = waving or excited) ═══ */}
                {(mood === 'waving' || mood === 'excited') && (
                    <motion.div
                        animate={{
                            rotate: [30, -10, 30],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                        className="absolute z-20"
                        style={{
                            right: s * 0.05,
                            top: headSize * 0.75,
                            width: headSize * 0.12,
                            height: headSize * 0.3,
                            borderRadius: headSize * 0.06,
                            background: 'linear-gradient(180deg, #2563eb, #1d4ed8)',
                            transformOrigin: 'bottom center',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                        }}
                    >
                        {/* Hand */}
                        <div
                            className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full"
                            style={{
                                width: headSize * 0.1,
                                height: headSize * 0.1,
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                boxShadow: '0 0 8px rgba(59,130,246,0.3)'
                            }}
                        />
                    </motion.div>
                )}

                {/* ═══ FLOATING SPARKLES ═══ */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={`sparkle-${i}`}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.8, 1.2, 0.8],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            delay: i * 1.2,
                            ease: 'easeInOut'
                        }}
                        className="absolute pointer-events-none"
                        style={{
                            left: i === 0 ? '10%' : i === 1 ? '85%' : '50%',
                            top: i === 0 ? '20%' : i === 1 ? '15%' : '5%',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                                fill={i === 1 ? '#fbbf24' : '#60a5fa'}
                                opacity={0.8}
                            />
                        </svg>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};
