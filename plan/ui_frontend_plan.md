# UI & FRONTEND PLAN: Employee Management System

## 1.1 Design goals
- Look: modern SaaS dashboard, clean, spacious, soft depth, light and dark themes.
- Feel: every interaction has a subtle GSAP-driven response. Motion explains what is happening and is never decoration.
- Usability: obvious actions, instant feedback, zero dead ends. Every state is designed: loading, empty, error, success.
- Maintainability: tokens in one place, animations in one place, every component has a single job.

## 1.2 Frontend stack
- Next.js 15 (App Router) + TypeScript strict. In pages and layouts, `params` is a Promise, so use `await params` (server) or `use(params)` (client).
- Tailwind CSS v4 + shadcn/ui (button, input, select, table, dialog, dropdown-menu, badge, card, skeleton, label, form, tooltip, sheet)
- GSAP 3.13+ with `@gsap/react` (`useGSAP`). All plugins are free: use `Flip`.
- TanStack Query v5, React Hook Form + Zod (`@hookform/resolvers/zod`)
- Recharts (charts), Sonner (toasts), lucide-react (icons), next-themes (dark mode)
- Fonts via `next/font/google`: "Plus Jakarta Sans" (UI, weights 400/500/600/700) and "JetBrains Mono" (employee IDs, numbers)

## 1.3 Design system: "Aurora Indigo"

### Color tokens (put in src/app/globals.css as CSS variables, map via Tailwind v4 @theme inline)
LIGHT
  --background:        #F5F6FB   page background
  --surface:           #FFFFFF   cards, table, dialogs
  --surface-2:         #EEF0F8   hover rows, inputs, subtle panels
  --border:            #E3E6F0
  --foreground:        #0F1530   main text
  --muted-foreground:  #6B7392   secondary text
  --primary:           #5B5BD6   indigo (buttons, active nav, links)
  --primary-hover:     #4B4BC4
  --primary-soft:      #ECECFC   tinted backgrounds
  --accent:            #14B8A6   teal (highlights, positive trends)
  --accent-soft:       #DDF7F3
  --success: #16A34A   --warning: #F59E0B   --danger: #E5484D   --info: #3B82F6
  --ring: #5B5BD6 at 40% opacity
DARK
  --background: #0A0E1F  --surface: #111733  --surface-2: #172042  --border: #232C52
  --foreground: #EEF0FF  --muted-foreground: #9AA3C7
  --primary: #7C7CF5  --primary-hover: #9090FA  --primary-soft: #1E1F4D
  --accent: #2DD4BF  --accent-soft: #0F2E32
BRAND GRADIENT: linear-gradient(135deg, #5B5BD6 0%, #8B5CF6 50%, #14B8A6 100%)
  Use only for: login brand panel, primary CTA hover glow, avatar fallbacks, chart highlight.
CHART PALETTE (8 departments): #5B5BD6 #14B8A6 #F59E0B #EC4899 #3B82F6 #8B5CF6 #22C55E #F97316
STATUS BADGES (tinted bg + colored text + 6px dot):
  active -> success, inactive -> muted gray/red, on_leave -> warning

### Shape, depth, spacing, type
- Radius: inputs/buttons 10px, cards 16px, dialogs 20px, badges and avatars full.
- Shadows (light): sm 0 1px 2px rgba(15,21,48,.06); md 0 8px 24px -8px rgba(15,21,48,.12);
  lg 0 24px 48px -12px rgba(91,91,214,.25) (hover glow). Dark mode: replace shadows with 1px borders plus a faint glow.
- Spacing: 4px grid. Page padding 24px (16px on mobile). Card padding 20-24px. Section gap 24px.
- Type scale: page title 28/36 bold; section title 18/28 semibold; body 14/22; caption 12/16; stat number 32/40 bold mono-tabular.
- Glass: the navbar uses backdrop-blur-md with background /80 and a bottom border.
- Focus: 2px ring in --ring with a 2px offset on every interactive element. Never remove outlines.

## 1.4 GSAP architecture (strict rules)
Files (all in src/animations/):
  gsap.ts        registers plugins ONCE and re-exports { gsap, useGSAP, Flip }. Components import ONLY from here.
  presets.ts     EASE, DUR, STAGGER constants plus reusable tween helpers (fadeUp, scaleIn, slideIn, shake, collapse).
  use-motion.ts  wrapper hook around useGSAP + gsap.matchMedia (handles prefers-reduced-motion).
  count-up.ts    number tween helper.
Reusable wrappers (src/components/motion/): <Reveal>, <Stagger>, <CountUp>, <AnimatedProgress>.

RULES
1. Use `useGSAP` from @gsap/react (never raw useEffect). Always pass `{ scope: containerRef }` and select children with
   class or data attributes (`[data-anim="card"]`) so selectors stay scoped and cleanup is automatic.
2. Event-driven animations (click, hover) use `contextSafe` from useGSAP so they are cleaned up on unmount.
3. Respect reduced motion: wrap everything in gsap.matchMedia "(prefers-reduced-motion: no-preference)" via useMotion.
   With reduced motion, content simply appears (no transforms).
4. Animate only `transform` and `opacity` (use `autoAlpha` and `x/y/scale`). Never animate width/height/top/left, with two exceptions:
   progress-bar width and row collapse (height). Use `clearProps: "transform"` after entrance tweens.
5. Never re-run entrance animations on background refetches. Dependencies are limited to the data identity that should
   re-animate (for example page number or filter key). Do not depend on the whole data object.
6. Never hide content in CSS waiting for JS. Use `gsap.from(...)`. useGSAP runs in a layout effect, so there is no flash.
7. Client components only ("use client"). GSAP never runs in server components.
8. Keep durations between 0.2 and 0.7s. Entrances use power3.out, hovers use power2.out, playful moments use back.out(1.4).
9. React StrictMode double-invoke is handled automatically by useGSAP cleanup. Do not add manual guards.

### Code that MUST exist

// src/animations/gsap.ts
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
gsap.registerPlugin(useGSAP, Flip);
export { gsap, useGSAP, Flip };

// src/animations/presets.ts
import { gsap } from "./gsap";
export const EASE = { smooth: "power3.out", snappy: "power2.out", soft: "power2.inOut", spring: "back.out(1.4)", expo: "expo.out" } as const;
export const DUR = { fast: 0.2, base: 0.4, slow: 0.7 } as const;
export const STAGGER = { tight: 0.04, base: 0.07, loose: 0.12 } as const;

export const fadeUp = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, y: 16, duration: DUR.base, ease: EASE.smooth, stagger: STAGGER.base, clearProps: "transform", ...vars });
export const scaleIn = (targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, scale: 0.94, duration: DUR.base, ease: EASE.spring, clearProps: "transform", ...vars });
export const slideInX = (targets: gsap.TweenTarget, x = 24, vars: gsap.TweenVars = {}) =>
  gsap.from(targets, { autoAlpha: 0, x, duration: DUR.base, ease: EASE.smooth, stagger: STAGGER.base, clearProps: "transform", ...vars });
export const shake = (target: gsap.TweenTarget) =>
  gsap.fromTo(target, { x: 0 }, { x: 0, duration: 0.5, ease: "none", keyframes: { x: [-10, 10, -8, 8, -4, 4, 0] } });
export const collapseRow = (el: Element, onDone: () => void) =>
  gsap.to(el, { height: 0, autoAlpha: 0, paddingTop: 0, paddingBottom: 0, duration: DUR.base, ease: EASE.soft, onComplete: onDone });

// src/animations/use-motion.ts
"use client";
import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
export function useMotion(
  fn: (ctx: { contextSafe: <T extends (...a: never[]) => unknown>(f: T) => T }) => void,
  opts: { scope: RefObject<HTMLElement | null>; dependencies?: unknown[] },
) {
  useGSAP((_ctx, contextSafe) => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => fn({ contextSafe: contextSafe! }));
    return () => mm.revert();
  }, { scope: opts.scope, dependencies: opts.dependencies ?? [], revertOnUpdate: true });
}

// src/animations/count-up.ts
import { gsap } from "./gsap";
export function countUp(el: HTMLElement, to: number, format: (n: number) => string, duration = 1.2) {
  const state = { v: 0 };
  return gsap.to(state, { v: to, duration, ease: "power2.out", onUpdate: () => { el.textContent = format(Math.round(state.v)); } });
}

## 1.5 Animation catalog (implement ALL)
| Where | Animation | Details |
|---|---|---|
| Route change (dashboard group) | Page enter | src/app/(dashboard)/template.tsx re-mounts per navigation: fadeUp of main content, y:12, 0.35s. (App Router has no exit animation, so this is enter-only.) |
| Login page | Intro timeline | Brand-panel gradient blobs float (infinite yoyo, 6-9s, sine.inOut); headline words stagger up (0.05s); form card scaleIn; fields stagger; CTA last. |
| Login failure | Shake | shake(formCard) plus an error message that slides down (height auto -> 0 to auto) |
| Sidebar | Mount stagger | Nav items slideInX from -16, stagger 0.05 |
| Sidebar | Active indicator | A single pill element moves to the active link with gsap.to (y/height, 0.35s, power3.out), using Flip when the sidebar collapses |
| Sidebar collapse (desktop) | Width tween | 264px to 76px, labels fade, 0.35s |
| Mobile nav | Sheet | Backdrop fade plus panel x:-100% to 0, links stagger |
| Theme toggle | Icon morph | Sun/moon rotate 90 degrees plus scale swap, 0.3s |
| Navbar | Scroll shadow | Shadow and border fade in after 8px scroll (ScrollTrigger-free: a passive scroll listener tweening opacity) |
| Dashboard header | Greeting | Fade up; time-based greeting ("Good morning, Admin") |
| Stat cards (4) | Entrance plus count-up | fadeUp stagger 0.08; numbers count 0 to value (1.2s); icon chip scaleIn with back.out |
| Stat card hover | Lift | y:-4 plus glow shadow, 0.25s via contextSafe mouseenter/leave (or quickTo) |
| Department bar chart | Reveal | Card fadeUp; Recharts native animationDuration 900; legend items stagger |
| Department list | Animated progress bars | Width 0 to pct%, 0.9s expo.out, stagger 0.06; count labels count up |
| Recent employees | List slide-in | slideInX 24, stagger 0.07; avatar scaleIn |
| Employees table rows | Page/filter change | Rows fadeUp y:10 stagger 0.03 (cap at the first 15 rows). Triggered only when page, sort, search or filter key changes, never on refetch |
| Table sort header | Arrow rotate | Chevron rotates 0/180 degrees, 0.25s; active header text color tween |
| Filter chips | Add/remove | Chip scaleIn on add, scale/fade out on remove |
| Search input | Focus | Container width grows 280 to 360px and icon color shifts (0.3s); "/" keyboard shortcut focuses it |
| Pagination | Number change | Active pill moves via Flip |
| Row delete success | Collapse | collapseRow() then invalidate queries in onComplete |
| Dialog open | Scale plus fade | Overlay 0 to 1 (0.2s); content scale .95 to 1, y 8 to 0 (0.3s back.out). Exit uses the Radix default fade |
| Form page | Section reveal | Section cards stagger fadeUp; fields stagger within the section |
| Form validation error | Slide down | Error text height 0 to auto plus fade (0.2s); invalid input does a subtle 4px x-shake |
| Submit button | States | idle -> loading (spinner fades in, label shifts) -> success (check icon scale back.out, 0.6s, then navigate) |
| Details page | Hero | Avatar scaleIn, name/designation fadeUp, info cards stagger, timeline items slideInX |
| Toasts | Sonner | Use Sonner's built-in transitions, themed to match |
| Empty state | Illustration | Floating loop on the icon (y:-8 yoyo, 2.5s); text fadeUp |
| Skeletons | Shimmer | CSS shimmer (cheaper than GSAP for loops) |
| 404/error pages | Entrance | Big number scaleIn plus slight rotation settle; CTA pulses once |

## 1.6 App shell (src/app/(dashboard)/layout.tsx)
- Desktop: fixed left Sidebar (264px, collapsible to 76px with tooltips) + top Navbar (64px, sticky, glass) + scrollable main (max-w 1280px, centered).
- Sidebar: logo plus app name; sections: Overview (Dashboard), People (All Employees, Add Employee); bottom: user card (avatar, name, role badge).
  Active link = primary-soft background, primary text, animated indicator pill.
- Navbar: page title and breadcrumbs (left); global "/" search hint, theme toggle, user dropdown (Profile info, Logout) (right).
- Mobile (<1024px): sidebar becomes a Sheet opened from a hamburger button; the table becomes a card list.
- Auth gate: the layout calls the session on the server (redirect to /login if there is none). Middleware is the first line of defence.

## 1.7 Pages (every element specified)

### /login (src/app/(auth)/login/page.tsx)
- Split layout. Left (hidden on mobile): brand gradient panel with floating blobs, logo, headline "Manage your people, effortlessly.",
  three feature bullets with icons.
- Right: card with title, subtitle, Email input (mail icon), Password input (lock icon + show/hide toggle),
  "Sign in" button (full width, loading spinner), inline error alert (role="alert").
- Behavior: RHF + zod(loginSchema); autofocus email; Enter submits; on success the button shows a check, then router.replace(next ?? "/dashboard").
  On 401 show a generic message plus shake; on 429 show "Too many attempts, try again in N minutes" (read Retry-After).

### /dashboard
- Header: greeting plus today's date; right: "Add Employee" primary button.
- Row of 4 StatCards: Total Employees (users icon, primary), Active (check-circle, success), Inactive/On Leave (pause-circle, warning), New This Month (sparkles, accent).
  Each has: icon chip, label, animated number, small caption ("+3 vs last month" only if data is available, else omit).
- Row 2 (2/3 + 1/3 grid): DepartmentChart (Recharts BarChart, rounded bars, custom tooltip, colored per department, axis labels truncated on mobile)
  | DepartmentBreakdown list (department, count, avg salary in INR, animated progress bar, click navigates to /employees?department=X).
- Row 3: RecentEmployees (5 rows: avatar, name, designation, department badge, joined date; links to details; "View all" link).
- States: skeleton for each card; error card with Retry; zero-data friendly message with a CTA to add the first employee.

### /employees
- Page header: title, count ("54 employees"), buttons [Export CSV] [Add Employee] (Add hidden for viewers).
- Toolbar card: SearchBar (debounced 400ms, clear "x" button), Department select, Status select, "Clear filters" ghost button (visible only when filters are active),
  rows-per-page select (10/25/50).
- Active filter chips row (animated).
- EmployeeTable columns: Employee (avatar + name + email) | ID (mono) | Department (colored dot badge) | Designation | Salary (en-IN INR, right-aligned) |
  Joined (e.g. 12 Mar 2024) | Status (StatusBadge) | Actions (dropdown: View, Edit, Delete).
  Sortable headers: name, department, salary, joiningDate, createdAt. Sticky header, row hover = surface-2, whole row clickable to details, zebra off.
- Mobile: EmployeeCard list (same data, stacked, actions in a dropdown).
- Footer: "Showing 11-20 of 54", Prev/Next, numbered pages with ellipsis.
- State = URL params: ?search=&department=&status=&sortBy=&order=&page=&limit=. Reset page to 1 when the search or filters change.
  Use `keepPreviousData` so the table does not flash while paging, and dim the old rows (opacity .6) while fetching.
- Empty: "No employees yet" plus Add CTA, versus "No results match your filters" plus Clear filters.

### /employees/new and /employees/[id]/edit
- One EmployeeForm (mode create|edit), 3 section cards, 2-column grid on desktop and 1 column on mobile:
  1. Personal: Full name, Email, Phone (with a +91 hint)
  2. Job: Department (select), Designation, Joining date (date input), Status (select, default active)
  3. Compensation: Salary (₹ prefix, numeric, formatted on blur, shown as "₹ 12,50,000" helper text)
- Sticky bottom action bar: Cancel (ghost) | Save (primary, loading state). Edit mode also disables Save until the form is dirty.
- Validation: zodResolver(createEmployeeSchema); mode "onTouched"; errors render under the field with an icon; first invalid field is focused on submit.
- Server errors: a 409 maps to setError("email", ...); other field errors from `errors[]` map by field; the generic message goes to a toast.
- Unsaved-changes guard: beforeunload plus a confirm dialog when navigating away from a dirty form.
- Edit page: skeleton form while loading; 404 renders the not-found UI; prefilled values (date formatted yyyy-MM-dd).

### /employees/[id]
- Hero card: large gradient-initial avatar, name, designation, StatusBadge, employeeId chip (copy-to-clipboard with a tooltip "Copied").
- Info grid cards: Contact (email with mailto, phone with tel), Job (department, designation, joining date, tenure "2 yrs 3 mos"), Compensation (salary).
- Timeline card: Created at, Last updated at.
- Actions: Back, Edit, Delete (DeleteConfirmDialog). Viewers see no Edit/Delete.
- Invalid/missing id -> friendly not-found state with a back link.

### Global pages
- not-found.tsx (404), error.tsx (with "Try again" calling reset()), loading.tsx (skeleton shell).

## 1.8 Component specs (src/features/* and src/components/*)
- StatCard {label, value, icon, tone, loading}: tone picks the icon-chip colors; value uses <CountUp>.
- StatusBadge {status}: dot plus label plus tinted bg.
- DepartmentBadge {department}: dot color from the chart palette via a DEPARTMENT_COLORS map (shared/constants).
- Avatar {name}: initials, deterministic gradient from a name hash (lib/avatar.ts).
- SearchBar: controlled, internal debounce with use-debounce, emits onChange(value) only after the delay.
- FilterBar: Selects for department and status plus a clear button. Reads and writes URL state via use-employee-url-state.
- EmployeeTable / EmployeeCard / EmployeeTableSkeleton / EmptyState / Pagination / DeleteConfirmDialog / EmployeeForm / FormSection / FormField (label + control + error wrapper).
- ConfirmDialog (common): generic; DeleteConfirmDialog composes it.
- PageHeader {title, description, actions}: standard header with the fadeUp intro.
- Logo, ThemeToggle, UserMenu, Sidebar, Navbar, MobileNav.

## 1.9 Data layer (frontend)
- src/lib/api-client.ts: typed fetch wrapper. It sends credentials, parses the standard response format, and throws ApiError {status, message, errors[]}.
  On 401 it redirects to /login.
- Query keys (features/employees/query-keys.ts):
  ["employees","list",params], ["employees","detail",id], ["dashboard","stats"]
- Mutations invalidate ["employees"] and ["dashboard"].
- Defaults: staleTime 30s, retry 1 (never retry on 4xx), refetchOnWindowFocus false.
- Dedicated hooks per file: use-employees-list, use-employee, use-create-employee, use-update-employee, use-delete-employee, use-dashboard-stats, use-auth.

## 1.10 Accessibility, responsive, performance
- WCAG AA contrast in both themes. Labels on all inputs, aria-invalid / aria-describedby on errors, aria-sort on table headers,
  dialogs trap focus and restore it, all actions are keyboard reachable, icon-only buttons have aria-label.
- Breakpoints: sm 640, md 768, lg 1024, xl 1280. Touch targets are at least 40px.
- Performance: dynamic-import Recharts (ssr:false); import only the needed GSAP plugins; no layout-thrashing animations; images are SVG only.

## 1.11 Frontend acceptance checklist
[ ] Light and dark themes both polished; the toggle persists (next-themes, no flash)
[ ] Every animation in the catalog implemented, scoped via useGSAP, reduced-motion safe
[ ] No entrance animation replays on background refetch
[ ] All pages have loading, empty, error and success states
[ ] URL-synced list state works with refresh, back button and shared links
[ ] Forms: inline errors, server error mapping, double-submit prevention, dirty guard
[ ] Delete: confirm dialog, row collapse animation, toast
[ ] Viewer role hides mutating controls
[ ] Mobile layout verified at 360px width
[ ] Lighthouse accessibility >= 95