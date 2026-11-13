import { gsap } from "./gsap";

export const EASE = {
  smooth: "power3.out",
  snappy: "power2.out",
  soft: "power2.inOut",
  spring: "back.out(1.4)",
  expo: "expo.out",
} as const;

export const DUR = { fast: 0.2, base: 0.4, slow: 0.7 } as const;

export const STAGGER = { tight: 0.04, base: 0.07, loose: 0.12 } as const;

export const fadeUp = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, {
    autoAlpha: 0,
    y: 16,
    duration: DUR.base,
    ease: EASE.smooth,
    stagger: STAGGER.base,
    clearProps: "transform",
    ...vars,
  });

export const scaleIn = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, {
    autoAlpha: 0,
    scale: 0.94,
    duration: DUR.base,
    ease: EASE.spring,
    clearProps: "transform",
    ...vars,
  });

export const slideInX = (
  targets: gsap.TweenTarget,
  x = 24,
  vars: gsap.TweenVars = {},
) =>
  gsap.from(targets, {
    autoAlpha: 0,
    x,
    duration: DUR.base,
    ease: EASE.smooth,
    stagger: STAGGER.base,
    clearProps: "transform",
    ...vars,
  });

/**
 * Card/panel shake. `amplitude` defaults to ±10px; form fields use a subtle 4px.
 */
export const shake = (target: gsap.TweenTarget, amplitude = 10) =>
  gsap.fromTo(
    target,
    { x: 0 },
    {
      x: 0,
      duration: 0.5,
      ease: "none",
      keyframes: {
        x: [
          -amplitude,
          amplitude,
          -amplitude * 0.8,
          amplitude * 0.8,
          -amplitude * 0.4,
          amplitude * 0.4,
          0,
        ],
      },
    },
  );

/**
 * Collapses a row to zero height, then calls `onDone` (used to invalidate
 * queries so the element is removed from React after the animation).
 * Handles table rows by also collapsing their cell padding.
 */
export const collapseRow = (el: Element, onDone: () => void) => {
  const cells =
    el instanceof HTMLTableRowElement ? Array.from(el.children) : [];

  const tl = gsap.timeline({ onComplete: onDone });

  if (cells.length > 0) {
    tl.to(
      cells,
      {
        paddingTop: 0,
        paddingBottom: 0,
        height: 0,
        autoAlpha: 0,
        duration: DUR.base,
        ease: EASE.soft,
      },
      0,
    );
  }

  tl.to(
    el,
    {
      height: 0,
      autoAlpha: 0,
      overflow: "hidden",
      duration: DUR.base,
      ease: EASE.soft,
    },
    0,
  );

  return tl;
};
