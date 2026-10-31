import { Cleanup, noop } from './env';

const SELECTOR = '[data-reveal]';

/** Retraso escalonado: <div data-stagger="80"> → cada hijo con data-reveal entra 80 ms después del anterior. */
function applyStagger(el: HTMLElement): void {
  const parent = el.parentElement;
  const step = parent ? Number(parent.dataset.stagger) : 0;
  if (!parent || !step) return;
  const siblings = Array.from(parent.children).filter((c) => c.hasAttribute('data-reveal'));
  const index = Math.min(siblings.indexOf(el), 12); // tope: nada espera más de ~1 s
  el.style.setProperty('--m-delay', `${index * step}ms`);
}

/**
 * Revela elementos [data-reveal] cuando entran al viewport.
 *
 * React monta y desmonta DOM todo el tiempo (cambio de módulo, listas que
 * cargan después…), así que además del IntersectionObserver se usa un
 * MutationObserver que registra los nodos nuevos. El estado se guarda en
 * `data-in` (React no lo toca); una clase se perdería en el siguiente render.
 */
export function initReveal(): Cleanup {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => (el.dataset.in = ''));
    return noop;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.in = '';
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );

  const seen = new WeakSet<Element>();
  const register = (el: HTMLElement) => {
    if (seen.has(el) || el.hasAttribute('data-in')) return;
    seen.add(el);
    applyStagger(el);
    io.observe(el);
  };

  const scan = (node: ParentNode) => {
    if (node instanceof HTMLElement && node.matches(SELECTOR)) register(node);
    node.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);
  };

  scan(document);

  // Procesa los nodos añadidos una vez por frame (evita trabajo repetido en ráfagas de render).
  let pending: Node[] = [];
  let queued = false;
  const flush = () => {
    queued = false;
    const batch = pending;
    pending = [];
    for (const n of batch) if (n.isConnected && n instanceof HTMLElement) scan(n);
  };

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) m.addedNodes.forEach((n) => pending.push(n));
    if (pending.length && !queued) {
      queued = true;
      requestAnimationFrame(flush);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
  };
}

