import { Cleanup, noop } from './env';
import { initReveal } from './reveal';
import { initPointerEffects } from './pointer';
import { initParallax } from './parallax';

export { enableCursorGlow } from './cursor';
export { animateNumber } from './number';
export type { Cleanup } from './env';

/**
 * Arranca la capa de movimiento global. Devuelve la función de limpieza.
 *
 * - Respeta `prefers-reduced-motion`, también si el usuario lo cambia con la app abierta.
 * - Sin esta función (o sin JS) la app se ve completa y estática: las reglas de
 *   ocultar-para-revelar solo existen bajo `html.m-on`.
 */
export function initMotion(): Cleanup {
  const root = document.documentElement;
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  let teardown: Cleanup = noop;

  const start = () => {
    teardown();
    teardown = noop;
    if (mql.matches) return;

    root.classList.add('m-on');
    const parts = [initReveal(), initPointerEffects(), initParallax()];
    teardown = () => {
      parts.forEach((stop) => stop());
      root.classList.remove('m-on');
    };
  };

  start();
  mql.addEventListener('change', start);

  return () => {
    mql.removeEventListener('change', start);
    teardown();
  };
}

