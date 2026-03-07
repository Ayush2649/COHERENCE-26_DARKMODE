"use client";

import { useRef, useMemo, useEffect } from "react";
import gsap from "gsap";

const DOT_COUNT = 220;
const DOT_SIZE = 3;
// Spherical cursor effect: plain center, visible ring at edge (symmetric around mouse)
const SPHERE_INNER = 6;   // inside this radius (%-of-view) = plain center, dots hidden
const SPHERE_RING_END = 22; // ring from SPHERE_INNER to here = visible dots
const RING_OPACITY = 0.92;
const OUTSIDE_OPACITY = 0.12; // rest of canvas: very subtle dots

export default function DynamicBackground() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, vw: 100, vh: 100 });
  const dotsRef = useRef([]);
  const rafRef = useRef(null);

  const dots = useMemo(() => {
    return Array.from({ length: DOT_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }));
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const w = typeof window !== "undefined" ? window.innerWidth : 100;
      const h = typeof window !== "undefined" ? window.innerHeight : 100;
      mouseRef.current.x = w > 0 ? Math.max(0, Math.min(1, e.clientX / w)) : 0.5;
      mouseRef.current.y = h > 0 ? Math.max(0, Math.min(1, e.clientY / h)) : 0.5;
      mouseRef.current.vw = w;
      mouseRef.current.vh = h;
    };

    const onLeave = () => {
      mouseRef.current.x = -1;
      mouseRef.current.y = -1;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    function tick() {
      const mouse = mouseRef.current;
      const mx = mouse.x;
      const my = mouse.y;
      const vw = mouse.vw || 100;
      const vh = mouse.vh || 100;
      const hasMouse = mx >= 0 && my >= 0;
      const minSide = Math.min(vw, vh);

      dotsRef.current.forEach((dotEl, i) => {
        if (!dotEl || !dotEl.style) return;
        const d = dots[i];

        if (!hasMouse) {
          gsap.set(dotEl, { opacity: OUTSIDE_OPACITY, scale: 1, x: 0, y: 0, overwrite: "auto" });
          return;
        }

        // Distance in physical pixels so the sphere is a perfect circle on screen
        const px = (d.left / 100 - mx) * vw;
        const py = (d.top / 100 - my) * vh;
        const distPx = Math.sqrt(px * px + py * py);
        const dist = (distPx / minSide) * 100; // % of smaller viewport dimension

        let opacity = OUTSIDE_OPACITY;
        let scale = 1;

        if (dist <= SPHERE_INNER) {
          opacity = 0;
          scale = 1;
        } else if (dist <= SPHERE_RING_END) {
          const t = (dist - SPHERE_INNER) / (SPHERE_RING_END - SPHERE_INNER);
          const smooth = t * t * (3 - 2 * t);
          opacity = smooth * RING_OPACITY;
          scale = 0.9 + smooth * 0.35;
        }

        gsap.set(dotEl, {
          opacity,
          scale,
          x: 0,
          y: 0,
          overwrite: "auto",
        });
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    if (typeof window !== "undefined") {
      mouseRef.current.vw = window.innerWidth;
      mouseRef.current.vh = window.innerHeight;
    }

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dots]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden bg-[oklch(0.985_0.002_260)] dark:bg-[oklch(0.13_0.005_285)]"
      aria-hidden
    >
      {dots.map((d, i) => (
        <span
          key={d.id}
          ref={(el) => { dotsRef.current[i] = el; }}
          className="absolute rounded-full bg-[oklch(0.32_0.14_265)] dark:bg-[oklch(0.65_0.15_265)] pointer-events-none will-change-transform"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${DOT_SIZE}px`,
            height: `${DOT_SIZE}px`,
            opacity: OUTSIDE_OPACITY,
          }}
        />
      ))}
    </div>
  );
}
