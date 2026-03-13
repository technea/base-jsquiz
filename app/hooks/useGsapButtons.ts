"use client";

import { useEffect, useCallback } from "react";
import { gsap } from "gsap";

/**
 * Global GSAP button enhancer.
 * Call once in the root component.
 * It observes the DOM and attaches magnetic hover, glow pulse,
 * shimmer sweep, click ripple & bounce to all <button> and <a> elements
 * that have not been flagged as enhanced yet.
 */
export function useGsapButtons() {
  const enhance = useCallback((btn: HTMLElement) => {
    if (btn.dataset.gsapEnhanced) return;
    btn.dataset.gsapEnhanced = "1";

    // ── Shimmer layer ──
    const shimmer = document.createElement("div");
    shimmer.className = "gsap-btn-shimmer";
    Object.assign(shimmer.style, {
      position: "absolute",
      top: "0",
      left: "-55%",
      width: "35%",
      height: "100%",
      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
      transform: "skewX(-18deg)",
      pointerEvents: "none",
      zIndex: "5",
      opacity: "0",
    });
    // Ensure parent can hold the shimmer
    const cs = getComputedStyle(btn);
    if (cs.position === "static") btn.style.position = "relative";
    if (cs.overflow !== "hidden") btn.style.overflow = "hidden";
    btn.appendChild(shimmer);

    // ── Glow layer ──
    const glow = document.createElement("div");
    glow.className = "gsap-btn-glow";
    Object.assign(glow.style, {
      position: "absolute",
      inset: "-6px",
      borderRadius: "inherit",
      background: "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.35) 0%, transparent 65%)",
      pointerEvents: "none",
      zIndex: "0",
      opacity: "0",
    });
    btn.appendChild(glow);

    // ── Entry stagger animation ──
    gsap.fromTo(btn,
      { opacity: 0, y: 16, scale: 0.92 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.5,
        ease: "back.out(1.6)",
        delay: Math.random() * 0.3 + 0.1,
      }
    );

    // ── HOVER IN ──
    const onEnter = (e: Event) => {
      gsap.to(btn, { scale: 1.06, y: -3, duration: 0.28, ease: "power2.out" });
      gsap.to(glow, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.set(shimmer, { left: "-55%", opacity: 1 });
      gsap.to(shimmer, { left: "120%", duration: 0.6, ease: "power2.inOut" });
    };

    // ── HOVER OUT ──
    const onLeave = () => {
      gsap.to(btn, { scale: 1, y: 0, x: 0, duration: 0.4, ease: "elastic.out(1, 0.55)" });
      gsap.to(glow, { opacity: 0, duration: 0.35, ease: "power2.out" });
      gsap.to(shimmer, { opacity: 0, duration: 0.2 });
    };

    // ── MOUSE-MOVE: subtle magnetic tilt ──
    const onMove = (e: Event) => {
      const me = e as MouseEvent;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (me.clientX - cx) * 0.12;
      const dy = (me.clientY - cy) * 0.12;
      gsap.to(btn, { x: dx, y: -3 + dy, duration: 0.2, ease: "power2.out" });
    };

    // ── CLICK: ripple + bounce ──
    const onClick = (e: Event) => {
      const me = e as MouseEvent;
      const rect = btn.getBoundingClientRect();
      const px = me.clientX - rect.left;
      const py = me.clientY - rect.top;

      // Bounce
      gsap.timeline()
        .to(btn, { scale: 0.92, duration: 0.08, ease: "power3.in" })
        .to(btn, { scale: 1.08, duration: 0.2, ease: "back.out(2.5)" })
        .to(btn, { scale: 1, duration: 0.35, ease: "elastic.out(1.1, 0.5)" });

      // Ripple circle
      const ripple = document.createElement("div");
      Object.assign(ripple.style, {
        position: "absolute",
        left: `${px}px`, top: `${py}px`,
        width: "6px", height: "6px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.55)",
        transform: "translate(-50%,-50%) scale(0)",
        pointerEvents: "none",
        zIndex: "10",
      });
      btn.appendChild(ripple);
      gsap.to(ripple, {
        scale: 22, opacity: 0,
        duration: 0.6, ease: "power2.out",
        onComplete: () => ripple.remove(),
      });
    };

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("click", onClick);

    // cleanup reference
    (btn as any).__gsapCleanup = () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("click", onClick);
      shimmer.remove();
      glow.remove();
    };
  }, []);

  useEffect(() => {
    // enhance all current buttons
    const selector = "button, a.btn, [role='button']";
    document.querySelectorAll<HTMLElement>(selector).forEach(enhance);

    // use MutationObserver so dynamically-added buttons also get enhanced
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(selector)) enhance(node);
          node.querySelectorAll?.<HTMLElement>(selector).forEach(enhance);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.querySelectorAll<HTMLElement>("[data-gsap-enhanced]").forEach((el) => {
        (el as any).__gsapCleanup?.();
        delete el.dataset.gsapEnhanced;
      });
    };
  }, [enhance]);
}
