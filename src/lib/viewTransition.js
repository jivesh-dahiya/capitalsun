import { flushSync } from 'react-dom';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function withViewTransition(fn) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    fn();
    return;
  }
  document.startViewTransition(() => {
    flushSync(fn);
  });
}
