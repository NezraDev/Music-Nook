import React, { useEffect, useRef } from "react";

const staff = (offset) => Array.from({ length: 81 }, (_, i) => {
  const x = i * 16;
  return `${i ? "L" : "M"}${x} ${122 + Math.sin(x / 180) * 34 + offset}`;
}).join(" ");

export function MusicScrollScene() {
  return (
    <div className="music-scroll-scene" aria-hidden="true">
      <div className="music-scene-label">PIANO <span>·</span> VOICE <span>·</span> GUITAR</div>
      <svg className="music-score" viewBox="0 0 1280 310" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="score-ink" x1="0" x2="1">
            <stop stopColor="#49b3b0" /><stop offset="0.55" stopColor="#b2e2d4" /><stop offset="1" stopColor="#e4c58c" />
          </linearGradient>
          <radialGradient id="score-halo">
            <stop stopColor="#49b3b0" stopOpacity="0.24" /><stop offset="1" stopColor="#49b3b0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse data-score-halo cx="640" cy="150" rx="290" ry="170" fill="url(#score-halo)" />
        {[-24, -12, 0, 12, 24].map((offset) => (
          <g key={offset}>
            <path d={staff(offset)} className="score-staff-base" />
            <path d={staff(offset)} className="score-staff-ink" pathLength="1" data-score-trace />
          </g>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <g data-score-note key={i} transform={`translate(${i * 145} 130)`} className={i % 3 === 0 ? "score-note score-note-gold" : "score-note"}>
            <ellipse cx="0" cy="0" rx="10" ry="7" transform="rotate(-22)" />
            <path d="M8 0v-48c18 4 22 14 12 24" />
            {i % 2 === 0 && <circle cx="22" cy="-3" r="2.5" />}
          </g>
        ))}
        <g transform="translate(510 243)" className="score-piano">
          <rect x="-12" y="-12" width="284" height="72" rx="10" fill="#172b3b" stroke="#49b3b0" strokeOpacity=".35" />
          {Array.from({ length: 14 }, (_, i) => <rect data-score-key key={i} x={i * 19} width="18" height="48" rx="2" fill="#f5efdf" />)}
          {Array.from({ length: 13 }, (_, i) => [0, 1, 3, 4, 5].includes(i % 7) && <rect key={i} x={i * 19 + 13} y="-1" width="10" height="30" rx="2" fill="#0d1929" />)}
        </g>
        <g className="score-rhythm" transform="translate(86 258)">
          {Array.from({ length: 24 }, (_, i) => <rect data-score-bar key={i} x={i * 11} y="-24" width="4" height="48" rx="2" />)}
        </g>
        <g className="score-rhythm" transform="translate(934 258)">
          {Array.from({ length: 24 }, (_, i) => <rect data-score-bar key={i} x={i * 11} y="-24" width="4" height="48" rx="2" />)}
        </g>
      </svg>
      <div className="music-scene-caption">Find your rhythm.</div>
    </div>
  );
}

export default function ScrollMusic({ main, pathname }) {
  const progress = useRef(null);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      const root = main.current;
      if (!root || preference.matches) {
        progress.current?.style.setProperty("transform", "scaleX(0)");
        return;
      }
      const revealed = new WeakSet();
      const reveals = new Map();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) { revealed.delete(entry.target); return; }
          if (revealed.has(entry.target)) return;
          revealed.add(entry.target);
          reveals.get(entry.target)?.cancel();
          const index = [...entry.target.parentElement.children].indexOf(entry.target);
          const animation = entry.target.animate([
            { opacity: 0, transform: "translateY(48px) scale(.97)" },
            { opacity: 1, transform: "translateY(0) scale(1)" },
          ], { duration: 800, delay: Math.min(index * 100, 300), easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
          reveals.set(entry.target, animation);
          animation.finished.then(() => {
            if (reveals.get(entry.target) === animation) reveals.delete(entry.target);
          }, () => {});
        });
      }, { threshold: 0.12 });
      const observe = () => root.querySelectorAll(".section-intro, .lesson, .benefits article, .music-benefit-grid article, .section-photo, .instructor-preview > div, .closing > div, .page-head > *, .hero-copy > *, .gallery-album").forEach((element) => {
        if (!revealed.has(element)) observer.observe(element);
      });
      observe();
      const changes = new MutationObserver(observe);
      changes.observe(root, { childList: true, subtree: true });
      const scenes = [...root.querySelectorAll(".music-scroll-scene")].map((element) => ({
        element, phase: null, target: 0,
        notes: [...element.querySelectorAll("[data-score-note]")],
        paths: [...element.querySelectorAll("[data-score-trace]")],
        keys: [...element.querySelectorAll("[data-score-key]")],
        bars: [...element.querySelectorAll("[data-score-bar]")],
        halo: element.querySelector("[data-score-halo]"),
      }));
      let frame = 0;
      const draw = () => {
        frame = 0;
        let moving = false;
        for (const scene of scenes) {
          if (scene.phase === null) scene.phase = scene.target;
          scene.phase += (scene.target - scene.phase) * 0.16;
          if (Math.abs(scene.target - scene.phase) > 0.0001) moving = true;
          const phase = scene.phase;
          scene.paths.forEach((path) => path.style.strokeDashoffset = String(1 - Math.min(1, phase * 1.5)));
          scene.notes.forEach((note, i) => {
            const x = ((i * 148 + phase * 980) % 1400) - 60;
            const y = 122 + Math.sin(x / 180) * 34 + ((i % 3) - 1) * 12;
            note.setAttribute("transform", `translate(${x} ${y}) rotate(${Math.sin(phase * 12 + i) * 8})`);
            note.style.opacity = String(Math.min(1, Math.max(0, (x + 20) / 80), Math.max(0, (1300 - x) / 80)));
          });
          scene.keys.forEach((key, i) => {
            const active = Math.floor(phase * 90) % 14;
            key.setAttribute("fill", i === active || i === (active + 4) % 14 ? "#49b3b0" : "#f5efdf");
            key.setAttribute("transform", i === active ? "translate(0 3)" : "translate(0 0)");
          });
          scene.bars.forEach((bar, i) => bar.style.transform = `scaleY(${0.15 + Math.abs(Math.sin(phase * 32 + i * 0.62)) * 0.85})`);
          scene.halo?.setAttribute("cx", String(200 + phase * 850));
        }
        if (moving && !document.hidden) frame = requestAnimationFrame(draw);
      };
      const measure = () => {
        const range = document.documentElement.scrollHeight - innerHeight;
        progress.current?.style.setProperty("transform", `scaleX(${range > 0 ? Math.min(1, scrollY / range) : 0})`);
        scenes.forEach((scene) => {
          const bounds = scene.element.getBoundingClientRect();
          scene.target = Math.max(0, Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height)));
        });
        if (!frame) frame = requestAnimationFrame(draw);
      };
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
      document.addEventListener("visibilitychange", measure);
      measure();
      cleanup = () => {
        observer.disconnect();
        changes.disconnect();
        reveals.forEach((animation) => animation.cancel());
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", measure);
        window.removeEventListener("resize", measure);
        document.removeEventListener("visibilitychange", measure);
      };
    };
    setup();
    preference.addEventListener("change", setup);
    return () => { cleanup(); preference.removeEventListener("change", setup); };
  }, [main, pathname]);
  return <div className="scroll-progress" aria-hidden="true"><span ref={progress} /></div>;
}
