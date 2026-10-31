import { useEffect } from 'react';
import { enableCursorGlow, initMotion } from '../lib/motion';

/** Arranca la capa de movimiento una sola vez. Llamarlo en <App />. */
export function useMotion(): void {
  useEffect(() => initMotion(), []);
}

/** Brillo que sigue al cursor mientras el componente esté montado (solo login/portadas). */
export function useCursorGlow(enabled = true): void {
  useEffect(() => (enabled ? enableCursorGlow() : undefined), [enabled]);
}

