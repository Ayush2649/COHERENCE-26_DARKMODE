"use client";

import { useEffect, useRef, useCallback } from "react";

const MIN_PARTICLES = 70;
const MAX_PARTICLES = 110;
const PARTICLE_RADIUS = 2.2;
const CONNECT_DISTANCE = 130;
const LINE_OPACITY_MAX = 0.28;
const PARTICLE_COLOR = "rgba(255, 255, 255, 0.75)";
const MOUSE_RADIUS = 180;
const MOUSE_REPEL_STRENGTH = 0.18;
const SPEED = 0.85;
const DRIFT = 0.5;
const FLOW_STRENGTH = 0.12;
const FLOW_FREQ = 0.0008;

function getParticleCount(w, h) {
  const area = w * h;
  const count = Math.floor(area / 18000);
  return Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, count));
}

function createParticle(w, h) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * SPEED;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: PARTICLE_RADIUS,
    phase: Math.random() * Math.PI * 2,
  };
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(null);

  const initParticles = useCallback((w, h) => {
    const count = getParticleCount(w, h);
    return Array.from({ length: count }, () => createParticle(w, h));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = initParticles(w, h);
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Clamp existing particle positions to new bounds
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        particles[i].x = Math.max(0, Math.min(w, particles[i].x));
        particles[i].y = Math.max(0, Math.min(h, particles[i].y));
      }
      const count = getParticleCount(w, h);
      const current = particlesRef.current.length;
      if (count > current) {
        const add = count - current;
        particlesRef.current = [
          ...particlesRef.current,
          ...Array.from({ length: add }, () => createParticle(w, h)),
        ];
      } else if (count < current) {
        particlesRef.current = particlesRef.current.slice(0, count);
      }
    };

    setSize();
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;
    const startTime = Date.now();

    const animate = () => {
      const width = w();
      const height = h();
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const t = (Date.now() - startTime) * 0.001;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 1) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_REPEL_STRENGTH;
          p.x -= (dx / dist) * force * (MOUSE_RADIUS - dist);
          p.y -= (dy / dist) * force * (MOUSE_RADIUS - dist);
        }

        const flowX = Math.sin(t * FLOW_FREQ * 1000 + p.phase) * FLOW_STRENGTH;
        const flowY = Math.cos(t * FLOW_FREQ * 800 + p.phase * 1.3) * FLOW_STRENGTH;
        p.vx += flowX + (Math.random() - 0.5) * 0.02;
        p.vy += flowY + (Math.random() - 0.5) * 0.02;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = SPEED + 0.3;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx + (Math.random() - 0.5) * DRIFT;
        p.y += p.vy + (Math.random() - 0.5) * DRIFT;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * LINE_OPACITY_MAX;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = PARTICLE_COLOR;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 block w-full h-full"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden
    />
  );
}
