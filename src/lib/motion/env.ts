// Utilidades base de la capa de movimiento (JS puro, sin dependencias).

export type Cleanup = () => void;
export const noop: Cleanup = () => {};

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mouse/trackpad real. En táctil no hay hover, así que no se activan tilt/magnetic/parallax. */
export const hasFinePointer = (): boolean =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

