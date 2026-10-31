import { Cleanup, hasFinePointer, lerp, noop } from './env';

const MAX_SHIFT_PX = 26;

/**
 * Parallax suave por posición del mouse:  <div data-parallax="1"> (negativo = sentido contrario).
 *
 * - Usa la propiedad CSS `translate`, que se compone con `transform`, así que
 *   convive con las animaciones .m-float sin pisarlas.
 * - El bucle de requestAnimationFrame solo corre mientras el cursor se mueve y
 *   se detiene al converger: en reposo no gasta CPU.
 * - Se vuelve a consultar el DOM en cada frame, de modo que sobrevive a los
 *   re-renders de React.
 */
export function initParallax(): Cleanup {
  if (!hasFinePointer()) return noop;

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let raf = 0;

  const tick = () => {
    x = lerp(x, targetX, 0.08);
    y = lerp(y, targetY, 0.08);

    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const depth = Number(el.dataset.parallax) || 1;
      el.style.translate = `${(x * depth * MAX_SHIFT_PX).toFixed(2)}px ${(y * depth * MAX_SHIFT_PX).toFixed(2)}px`;
    });

    const settled = Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001;
    raf = settled ? 0 : requestAnimationFrame(tick);
  };

  const onMove = (e: PointerEvent) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(raf);
  };
}

