import { gsap } from "./gsap";

/**
 * Tween a number from 0 to `to`, writing the formatted value into `el`.
 * Returns the GSAP tween so callers can control or cancel it.
 */
export function countUp(
  el: HTMLElement,
  to: number,
  format: (n: number) => string,
  duration = 1.2,
) {
  const state = { v: 0 };

  return gsap.to(state, {
    v: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = format(Math.round(state.v));
    },
  });
}
