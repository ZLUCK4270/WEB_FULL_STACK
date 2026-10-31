import { Cleanup, hasFinePointer, lerp, noop, prefersReducedMotion } from './env';

/**
 * Brillo suave que sigue al cursor, con inercia.
 * Pensado SOLO para pantallas de presentación (login). No usarlo en el POS:
 * el cajero necesita precisión y velocidad, no un cursor decorado.
 */
export function enableCursorGlow(): Cleanup {
  if (!hasFinePointer() || prefersReducedMotion()) return noop;

  const el = document.createElement('div');
  el.className = 'm-cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  const OFFSCREEN = -9999;
  let targetX = OFFSCREEN;
  let targetY = OFFSCREEN;
  let x = OFFSCREEN;
  let y = OFFSCREEN;
  let raf = 0;

  const tick = () => {
    x = lerp(x, targetX, 0.16);
    y = lerp(y, targetY, 0.16);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    const settled = Math.abs(targetX - x) < 0.3 && Math.abs(targetY - y) < 0.3;
    raf = settled ? 0 : requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (x === OFFSCREEN) {
      x = e.clientX; // primera vez: aparece en su sitio, sin recorrer la pantalla
      y = e.clientY;
    }
    targetX = e.clientX;
    targetY = e.clientY;
    el.dataset.on = '';
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const onLeave = () => {
    delete el.dataset.on;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);

  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    cancelAnimationFrame(raf);
    el.remove();
  };
}

