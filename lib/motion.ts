/**
 * Emil Kowalski motion presets.
 * - spring: content entering (list items, panels) — natural physics
 * - springSoft: larger panels / view transitions
 * - easeOut: micro-interactions (icons, chips) — strong custom curve
 * - easeOutFast: very small elements (badge swap, status icons)
 *
 * Rule: never ease-in, never linear for UI, never > 300ms on UI elements.
 * Strong ease-out cubic: cubic-bezier(0.23, 1, 0.32, 1) — Emil's recommended curve.
 */
import type { Transition } from 'framer-motion';

export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
};

export const easeOut: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

export const easeOutFast: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};
