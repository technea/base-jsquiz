"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Zap } from "lucide-react";

interface PlaygroundButtonProps {
  onClick?: () => void;
  isDarkMode?: boolean;
}

export const PlaygroundButton = ({
  onClick,
  isDarkMode = true,
}: PlaygroundButtonProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const particleBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    const ring1 = ring1Ref.current;
    const ring2 = ring2Ref.current;
    const shimmer = shimmerRef.current;
    const glow = glowRef.current;
    const text = textRef.current;
    const icon = iconRef.current;
    const dot = dotRef.current;
    if (!btn || !ring1 || !ring2 || !shimmer || !glow || !text || !icon || !dot) return;

    /* ── initial hidden state ── */
    gsap.set(btn, { opacity: 0, scale: 0.6, y: 30 });
    gsap.set([ring1, ring2], { scale: 0.5, opacity: 0 });
    gsap.set(text, { opacity: 0, y: 10 });
    gsap.set(icon, { opacity: 0, scale: 0, rotate: -45 });
    gsap.set(dot, { opacity: 0, scale: 0 });

    /* ── ENTRY: dramatic pop-in ── */
    const entry = gsap.timeline({ delay: 0.2 });

    entry
      .to(btn, { opacity: 1, scale: 1.1, y: 0, duration: 0.55, ease: "back.out(2.2)" })
      .to(btn, { scale: 1, duration: 0.3, ease: "elastic.out(1.1, 0.45)" }, "-=0.1")
      .to(icon, { opacity: 1, scale: 1, rotate: 0, duration: 0.4, ease: "back.out(3)" }, "-=0.35")
      .to(text, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, "-=0.25")
      .to(dot, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, "-=0.2")
      .to([ring1, ring2], { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.3")
      /* attention bounce */
      .to(btn, { scale: 1.08, duration: 0.15, ease: "power2.out" })
      .to(btn, { scale: 1, duration: 0.3, ease: "elastic.out(1.2, 0.5)" });

    /* ── BREATHING GLOW ── */
    gsap.to(glow, {
      opacity: 0.9,
      scale: 1.35,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    /* ── PULSE RINGS ── */
    const pulseTl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    pulseTl
      .fromTo(ring1, { scale: 1, opacity: 0.7 }, { scale: 1.65, opacity: 0, duration: 1.4, ease: "power2.out" })
      .fromTo(ring2, { scale: 1, opacity: 0.5 }, { scale: 1.9, opacity: 0, duration: 1.7, ease: "power2.out" }, "-=1.2");

    /* ── SHIMMER SWEEP ── */
    gsap.to(shimmer, {
      x: "260%",
      duration: 2,
      repeat: -1,
      ease: "none",
      repeatDelay: 1.5,
    });

    return () => {
      entry.kill();
      pulseTl.kill();
    };
  }, []);

  /* ── MAGNETIC HOVER ── */
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.28;
    const dy = (e.clientY - cy) * 0.28;
    gsap.to(btn, { x: dx, y: dy, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseEnter = () => {
    const btn = btnRef.current;
    const glow = glowRef.current;
    const icon = iconRef.current;
    if (!btn || !glow || !icon) return;

    gsap.to(btn, { scale: 1.07, duration: 0.3, ease: "power2.out" });
    gsap.to(glow, { opacity: 1, scale: 1.6, duration: 0.35, ease: "power2.out" });
    gsap.to(icon, { rotate: 20, scale: 1.3, duration: 0.35, ease: "back.out(2)" });
  };

  const handleMouseLeave = () => {
    const btn = btnRef.current;
    const glow = glowRef.current;
    const icon = iconRef.current;
    if (!btn || !glow || !icon) return;

    gsap.to(btn, { scale: 1, x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    gsap.to(glow, { opacity: 0.5, scale: 1, duration: 0.4, ease: "power2.out" });
    gsap.to(icon, { rotate: 0, scale: 1, duration: 0.4, ease: "back.out(2)" });
  };

  /* ── CLICK: shockwave + particle burst ── */
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    const box = particleBoxRef.current;
    if (!btn || !box) return;

    /* bounce */
    gsap.timeline()
      .to(btn, { scale: 0.88, duration: 0.1, ease: "power3.in" })
      .to(btn, { scale: 1.1, duration: 0.22, ease: "back.out(3)" })
      .to(btn, { scale: 1, duration: 0.35, ease: "elastic.out(1.2, 0.5)" });

    /* shockwave */
    const rect = btn.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const wave = document.createElement("div");
    Object.assign(wave.style, {
      position: "absolute", left: `${px}px`, top: `${py}px`,
      width: "8px", height: "8px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(165,180,252,0.4))",
      transform: "translate(-50%,-50%) scale(0)",
      pointerEvents: "none",
    });
    box.appendChild(wave);
    gsap.to(wave, {
      scale: 26, opacity: 0, duration: 0.65, ease: "power2.out",
      onComplete: () => wave.remove(),
    });

    /* floating spark particles */
    const colors = ["#a5f3fc", "#fde68a", "#c4b5fd", "#6ee7b7", "#fb7185"];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("div");
      const size = 4 + Math.random() * 5;
      Object.assign(p.style, {
        position: "absolute",
        left: "50%", top: "50%",
        width: `${size}px`, height: `${size}px`,
        borderRadius: "50%",
        background: colors[Math.floor(Math.random() * colors.length)],
        pointerEvents: "none",
        zIndex: "20",
      });
      box.appendChild(p);
      const angle = (i / 12) * 360;
      const dist = 55 + Math.random() * 45;
      gsap.fromTo(
        p,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: Math.cos((angle * Math.PI) / 180) * dist,
          y: Math.sin((angle * Math.PI) / 180) * dist,
          scale: 0,
          opacity: 0,
          duration: 0.55 + Math.random() * 0.3,
          ease: "power2.out",
          onComplete: () => p.remove(),
        }
      );
    }

    onClick?.();
  };

  return (
    <div ref={wrapperRef} className="pg-btn-wrap" style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
      {/* Pulse rings (behind button) */}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>

        <div ref={ring1Ref} style={{
          position: "absolute", inset: "-4px",
          borderRadius: "999px",
          border: "2px solid rgba(129,140,248,0.7)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        <div ref={ring2Ref} style={{
          position: "absolute", inset: "-4px",
          borderRadius: "999px",
          border: "2px solid rgba(167,139,250,0.45)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Ambient glow blob */}
        <div ref={glowRef} style={{
          position: "absolute", inset: "-28px",
          background: "radial-gradient(ellipse at 50% 55%, rgba(99,102,241,0.55) 0%, rgba(124,58,237,0.35) 40%, transparent 70%)",
          borderRadius: "999px",
          pointerEvents: "none",
          opacity: 0.5,
          zIndex: 0,
        }} />

        {/* THE BUTTON */}
        <button
          ref={btnRef}
          id="playground-btn"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "18px 52px",
            borderRadius: "999px",
            border: "1.5px solid rgba(165,180,252,0.35)",
            background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #7c3aed 75%, #8b5cf6 100%)",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: "15px",
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
            outline: "none",
            overflow: "hidden",
            boxShadow: "0 0 0 2px rgba(99,102,241,0.25), 0 12px 40px rgba(79,70,229,0.55), 0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            willChange: "transform",
            isolation: "isolate",
          }}
        >
          {/* Shimmer */}
          <div ref={shimmerRef} style={{
            position: "absolute", top: 0, left: "-50%",
            width: "35%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)",
            transform: "skewX(-18deg)",
            pointerEvents: "none",
            zIndex: 1,
          }} />

          {/* Top edge highlight */}
          <div style={{
            position: "absolute", top: 0, left: "15%", right: "15%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
            pointerEvents: "none",
          }} />

          {/* Particles & ripple container */}
          <div ref={particleBoxRef} style={{
            position: "absolute", inset: 0, overflow: "hidden",
            borderRadius: "inherit", pointerEvents: "none", zIndex: 2,
          }} />

          {/* ⚡ Icon */}
          <div ref={iconRef} style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", lineHeight: 1 }}>
            <Zap style={{
              width: "22px", height: "22px",
              fill: "#fde68a", color: "#fde68a",
              filter: "drop-shadow(0 0 8px rgba(253,230,138,0.85)) drop-shadow(0 0 3px rgba(253,230,138,0.5))",
            }} />
          </div>

          {/* Label */}
          <span ref={textRef} style={{ position: "relative", zIndex: 3, lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            Playground
          </span>

          {/* Live dot */}
          <span ref={dotRef} style={{
            position: "relative", zIndex: 3,
            width: "9px", height: "9px",
            borderRadius: "50%",
            background: "#6ee7b7",
            boxShadow: "0 0 10px 4px rgba(110,231,183,0.65), 0 0 4px 2px rgba(110,231,183,0.5)",
            flexShrink: 0,
            animation: "pgDotPulse 2s ease-in-out infinite",
          }} />
        </button>
      </div>

      <style>{`
        @keyframes pgDotPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px 4px rgba(110,231,183,0.65), 0 0 4px 2px rgba(110,231,183,0.5); }
          50% { opacity: 0.4; box-shadow: 0 0 4px 2px rgba(110,231,183,0.2); }
        }
      `}</style>
    </div>
  );
};
