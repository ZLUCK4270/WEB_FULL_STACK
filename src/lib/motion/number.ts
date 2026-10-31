import { Cleanup, clamp, easeOutExpo, noop, prefersReducedMotion } from './env';

interface AnimateNumberOptions {
  duration?: number;
  onUpdate: (value: number) => void;
}

/**
 * Interpola un número de `from` a `to` con requestAnimationFrame (ease-out expo).
 * Devuelve una función para cancelarla. Con reduced-motion salta directo al valor final.
 */
export function animateNumber(from: number, to: number, { duration = 900, onUpdate }: AnimateNumberOptions): Cleanup {
  if (prefersReducedMotion() || duration <= 0 || from === to) {
    onUpdate(to);
    return noop;
  }

  const start = performance.now();
  let raf = 0;

  const step = (now: number) => {
    const progress = clamp((now - start) / duration, 0, 1);
    onUpdate(from + (to - from) * easeOutExpo(progress));
    if (progress < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  return () => cancelAnimationFrame(raf);
}

