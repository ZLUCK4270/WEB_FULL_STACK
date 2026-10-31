import { Cleanup, hasFinePointer } from './env';

/**
 * Efectos de puntero por DELEGACIÓN: un solo listener en `document`, no uno por
 * elemento. Así funcionan con cualquier nodo que React cree después y no hay
 * listeners que limpiar en cada desmontaje.
 *
 *   data-magnetic="0.25"  el elemento se acerca al cursor (fracción de la distancia)
 *   data-tilt="6"         inclinación 3D en grados máximos (+ foco de luz)
 *   data-spotlight        foco de luz que sigue al cursor
 *   data-ripple           onda al pulsar (también en táctil)
 */
const HOVER_SELECTOR = '[data-magnetic],[data-tilt],[data-spotlight]';
const MAGNETIC_PAD = 18; // px de "campo de atracción" alrededor del botón

const within = (r: DOMRect, x: number, y: number, pad: number): boolean =>
  x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;

export function initPointerEffects(): Cleanup {
  const fine = hasFinePointer();

  let current: HTMLElement | null = null;
  let rect: DOMRect | null = null; // se mide al entrar: el elemento aún no se ha movido
  let px = 0;
  let py = 0;
  let queued = false;

  const reset = (el: HTMLElement | null) => {
    if (!el) return;
    if (el.hasAttribute('data-tilt')) el.style.transform = '';
    if (el.hasAttribute('data-magnetic')) el.style.translate = '';
  };

  const apply = () => {
    queued = false;
    if (!current || !rect) return;
    const x = px - rect.left;
    const y = py - rect.top;

    if (current.hasAttribute('data-spotlight') || current.hasAttribute('data-tilt')) {
      current.style.setProperty('--mx', `${x.toFixed(0)}px`);
      current.style.setProperty('--my', `${y.toFixed(0)}px`);
    }
    if (current.hasAttribute('data-tilt')) {
      const max = Number(current.dataset.tilt) || 6;
      const rx = ((y / rect.height) - 0.5) * -2 * max;
      const ry = ((x / rect.width) - 0.5) * 2 * max;
      current.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
    if (current.hasAttribute('data-magnetic')) {
      const strength = Number(current.dataset.magnetic) || 0.25;
      const dx = (x - rect.width / 2) * strength;
      const dy = (y - rect.height / 2) * strength;
      current.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    }
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    // Mientras el cursor siga dentro del área ORIGINAL del elemento (medida al entrar),
    // el efecto sigue activo. No se pregunta "¿qué hay bajo el cursor?" a un elemento que
    // el propio efecto está desplazando o inclinando: su posición renderizada va con retraso
    // respecto a la ordenada y el efecto se cortaría a medias en movimientos rápidos.
    const pad = current?.hasAttribute('data-magnetic') ? MAGNETIC_PAD : 0;
    const stillInside = !!current && !!rect && within(rect, e.clientX, e.clientY, pad);

    if (!stillInside) {
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>(HOVER_SELECTOR) : null;
      if (target !== current) {
        reset(current);
        current = target;
        rect = target ? target.getBoundingClientRect() : null;
      }
    }
    if (!current) return;

    px = e.clientX;
    py = e.clientY;
    if (!queued) {
      queued = true;
      requestAnimationFrame(apply);
    }
  };

  const onWindowLeave = () => {
    reset(current);
    current = null;
    rect = null;
  };

  const onDown = (e: PointerEvent) => {
    const host = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-ripple]') : null;
    if (!host || (host as HTMLButtonElement).disabled) return;

    const r = host.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const dot = document.createElement('span');
    dot.className = 'm-ripple-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${e.clientX - r.left - size / 2}px`;
    dot.style.top = `${e.clientY - r.top - size / 2}px`;
    host.appendChild(dot);

    const remove = () => dot.remove();
    dot.addEventListener('animationend', remove, { once: true });
    window.setTimeout(remove, 900); // red de seguridad si la animación no llega a correr
  };

  document.addEventListener('pointerdown', onDown, { passive: true });
  if (fine) {
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onWindowLeave);
    // Al hacer scroll el rectángulo medido queda obsoleto: se suelta el elemento y se
    // vuelve a elegir en el siguiente movimiento.
    window.addEventListener('scroll', onWindowLeave, { passive: true, capture: true });
  }

  return () => {
    document.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onWindowLeave);
    window.removeEventListener('scroll', onWindowLeave, { capture: true });
    reset(current);
  };
}

