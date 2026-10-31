import React, { useEffect, useRef, useState } from 'react';
import { animateNumber } from '../../lib/motion';

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

/**
 * Número que "cuenta" hasta su valor. El estado vive aquí, no en el padre:
 * solo se re-renderiza este <span>, no todo el dashboard, en cada frame.
 * Los lectores de pantalla reciben el valor final una sola vez.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 900,
}) => {
  const [display, setDisplay] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const safe = Number.isFinite(value) ? value : 0;
    return animateNumber(shown.current, safe, {
      duration,
      onUpdate: (v) => {
        shown.current = v;
        setDisplay(v);
      },
    });
  }, [value, duration]);

  const format = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;

  return (
    <span>
      <span aria-hidden="true">{format(display)}</span>
      <span className="sr-only">{format(Number.isFinite(value) ? value : 0)}</span>
    </span>
  );
};

