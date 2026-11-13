# Animation rules

All GSAP setup lives in `src/animations/`. **Never import `gsap` directly** —
always import from `@/animations/gsap` or `@/animations/presets`.

## Files

| File            | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `gsap.ts`       | Registers plugins once, re-exports `{ gsap, useGSAP, Flip }`                       |
| `presets.ts`    | `EASE`, `DUR`, `STAGGER` + `fadeUp`, `scaleIn`, `slideInX`, `shake`, `collapseRow` |
| `use-motion.ts` | `useMotion` — `useGSAP` + `gsap.matchMedia` (reduced-motion safe)                  |
| `count-up.ts`   | `countUp(el, to, format)` number tween                                             |

Reusable wrappers live in `src/components/motion/`:
`<Reveal>`, `<Stagger>`, `<CountUp>`, `<AnimatedProgress>`.

## Rules

1. Use `useGSAP` from `@/animations/gsap`, never raw `useEffect`. Always pass
   `{ scope: containerRef }` and select children with `[data-anim="..."]` so
   selectors stay scoped and cleanup is automatic.
2. Event-driven animations (click, hover) use `contextSafe` from `useGSAP` /
   `useMotion` so they are cleaned up on unmount.
3. Reduced motion: wrap everything in `gsap.matchMedia`
   `"(prefers-reduced-motion: no-preference)"` via `useMotion`. With reduced
   motion, content simply appears (no transforms).
4. Animate only `transform` and `opacity` (`autoAlpha`, `x/y/scale`). Never
   animate width/height/top/left — two exceptions: progress-bar width and row
   collapse height. Use `clearProps: "transform"` after entrance tweens.
5. Never re-run entrance animations on background refetches. Depend only on the
   data identity that should re-animate (page number, filter key) — never the
   whole data object.
6. Never hide content in CSS waiting for JS. Use `gsap.from(...)`; `useGSAP`
   runs in a layout effect, so there is no flash.
7. Client components only (`"use client"`). GSAP never runs in server
   components.
8. Durations stay between 0.2s and 0.7s. Entrances use `power3.out`, hovers
   `power2.out`, playful moments `back.out(1.4)`.
9. React StrictMode double-invokes are handled by `useGSAP` cleanup — do not
   add manual guards.
