# UPGRADE PROMPT: UI Re-skin to "Ink & Paper" (black and white + one highlight color)

Re-skin the existing Employee Management System UI. KEEP all layouts, alignments, component structure, GSAP architecture, animation catalog, accessibility rules and behavior exactly as they are. CHANGE only: color system, typography, shape/depth, imagery, and the small animation retunes listed in section 8. Output complete files for everything changed (full path as heading). No "...", no TODOs. This also applies to the new Login Access, UsernameField, /me and /account screens.

# 1. DESIGN DIRECTION
"Ink & Paper": a premium editorial look. Warm off-white paper and deep black ink, hairline rules, generous whitespace, a classic serif for display type paired with a clean modern sans for UI. ONE highlight color (vermilion) used rarely so it reads as a deliberate accent. No gradients, no colored status badges, no colored charts, no glows.
Classic touches: serif page titles with an italic emphasis word, uppercase tracked "eyebrow" labels with index numbers ("01 / Personal"), hairline double rules under page headers, a masthead-style date line, thin 1.5px icons.

# 2. FONTS (Google Fonts via next/font only; no <link> tags)
- Display (titles, big numbers, 404): "Instrument Serif" (regular + italic)
- UI (everything else): "Geist" (400 / 500 / 600)
- Mono (employee IDs, usernames, codes): "Geist Mono"
Fallback pairing if a font is unavailable: display -> "Fraunces" or "Playfair Display"; UI -> "Manrope" or "DM Sans".

// src/app/layout.tsx
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const ui = Geist({ subsets: ["latin"], variable: "--f-ui", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap" });
// <html lang="en" suppressHydrationWarning className={`${display.variable} ${ui.variable} ${mono.variable}`}>
// next-themes: <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>

Type scale:
| Use | Font | Size / line | Notes |
|---|---|---|---|
| Page title | Display | 44/48 (mobile 34/38) | tracking -0.02em; one word in <em> (italic) |
| Stat number | Display | 56/56 | tabular-nums; wrap in inline-block with min-width equal to the final digit count in `ch` so the count-up never jitters |
| Section title | UI 600 | 18/26 | |
| Eyebrow label | UI 500 | 11/16, uppercase, tracking 0.12em | muted; optional index "01" in mono |
| Body | UI 400 | 14/22 | |
| Table header | UI 500 | 11/16, uppercase, tracking 0.08em | muted |
| Table cell | UI 400 | 14/20 | numbers use tabular-nums |
| IDs / usernames | Mono | 12/16 | |
| Buttons | UI 500 | 14/20 | |

# 3. COLOR SYSTEM (src/app/globals.css: replace ALL old tokens)

@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* Ink & Paper */
  --paper: #FAFAF7;  --ink: #0A0A0A;
  --background: var(--paper);  --foreground: var(--ink);
  --surface: #FFFFFF;  --surface-2: #F3F3EF;
  --border: #E5E5E0;  --border-strong: #CFCFC8;
  --muted-foreground: #6A6A64;
  /* THE highlight (use sparingly, see section 4) */
  --highlight: #FF4F1A;        /* fills, bars, icons, rings */
  --highlight-ink: #C93305;    /* highlight used as TEXT on light (>= 4.5:1 on paper) */
  --highlight-soft: #FFEDE6;   /* rare tinted backgrounds */
  /* shadcn mapping. NOTE: shadcn's "accent" is a NEUTRAL hover surface, NOT the highlight */
  --card: var(--surface);  --card-foreground: var(--foreground);
  --popover: var(--surface);  --popover-foreground: var(--foreground);
  --primary: var(--ink);  --primary-foreground: var(--paper);
  --secondary: var(--surface-2);  --secondary-foreground: var(--foreground);
  --muted: var(--surface-2);
  --accent: var(--surface-2);  --accent-foreground: var(--foreground);
  --destructive: var(--ink);  --destructive-foreground: var(--paper);
  --input: var(--border-strong);  --ring: var(--highlight);
  --radius: 0.75rem;
  --shadow-pop: 0 12px 32px -12px rgb(10 10 10 / 0.18);
}
.dark {
  --paper: #0A0A0A;  --ink: #F5F5F2;
  --background: #0A0A0A;  --foreground: #F5F5F2;
  --surface: #121212;  --surface-2: #1A1A1A;
  --border: #262626;  --border-strong: #3A3A38;
  --muted-foreground: #8E8E88;
  --highlight: #FF5A2B;  --highlight-ink: #FF7A50;  --highlight-soft: #2B140C;
  --shadow-pop: 0 12px 32px -12px rgb(0 0 0 / 0.7);
}
@theme inline {
  --color-background: var(--background);  --color-foreground: var(--foreground);
  --color-surface: var(--surface);  --color-surface-2: var(--surface-2);
  --color-border: var(--border);  --color-border-strong: var(--border-strong);
  --color-muted-foreground: var(--muted-foreground);
  --color-card: var(--card);  --color-popover: var(--popover);
  --color-primary: var(--primary);  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);  --color-muted: var(--muted);
  --color-accent: var(--accent);  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);  --color-ring: var(--ring);  --color-input: var(--input);
  --color-highlight: var(--highlight);  --color-highlight-ink: var(--highlight-ink);  --color-highlight-soft: var(--highlight-soft);
  --font-sans: var(--f-ui), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--f-display), "Times New Roman", serif;
  --font-mono: var(--f-mono), ui-monospace, SFMono-Regular, monospace;
  --radius-sm: 6px;  --radius-md: 8px;  --radius-lg: 12px;  --radius-xl: 16px;
}

@layer base {
  body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; font-optical-sizing: auto; }
  h1, h2 { font-family: var(--font-display); font-weight: 400; letter-spacing: -0.02em; }
  h1 em, h2 em { font-style: italic; }
  ::selection { background: var(--highlight); color: #0A0A0A; }
  :focus-visible { outline: 2px solid var(--highlight); outline-offset: 2px; border-radius: 4px; }   /* highlight at focus = unmistakable, transient */
  .tabular { font-variant-numeric: tabular-nums; }
}
/* paper grain (3% opacity, pointer-events none) */
body::before {
  content: ""; position: fixed; inset: 0; z-index: 60; pointer-events: none; opacity: .035; mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.dark body::before { mix-blend-mode: screen; opacity: .05; }
/* neutral skeleton shimmer */
.skeleton { background: linear-gradient(90deg, var(--surface-2) 0%, var(--border) 50%, var(--surface-2) 100%); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }

DELETE: every indigo / teal / violet token, the brand gradient, success/warning/danger/info tokens, shadow-lg glow, and DEPARTMENT_COLORS in shared/constants (remove all imports of it).

# 4. HIGHLIGHT RULES (the most important part)
The highlight is a seasoning. At rest, at most 3 highlight touches may be visible in one viewport.
ALLOWED (static):
  1. Active sidebar item: a 2px vertical bar on its left edge (also the sliding indicator)
  2. The top department bar in the dashboard chart and the top progress bar in the breakdown list
  3. The logo dot
  4. The active sort arrow in a table header
  5. Input error underline (2px) + alert icon, and the "taken / invalid" username status icon
ALLOWED (transient): focus ring, text selection, button arrow on hover, link underline on hover, toast icon, active pagination page underline.
FORBIDDEN: backgrounds of cards or sections, body text, badges, charts other than the top bar, more than one adjacent element, large areas, decorative use.
Text rule: never set small text in --highlight. Use --highlight-ink for any highlight-colored text under 18px. Never rely on color alone: always pair it with an icon or text.
Required fields are unmarked; optional fields get a muted "Optional" label (no colored asterisks).

# 5. SHAPE, DEPTH, BORDERS
- Radius: inputs/buttons 8px, cards 12px, dialogs/sheets 16px, avatars and dots full.
- Depth comes from 1px borders, not shadows. Shadow is allowed only on popovers, dropdowns and dialogs (--shadow-pop). No colored or glow shadows. Cards: bg surface, 1px border.
- Hairline rules: section separators are 1px var(--border). Page headers end with a double rule (1px border, 3px gap, 1px border).
- Icons: lucide-react, strokeWidth 1.5 (set globally via a wrapper or default prop), size 16/18/20.
- Glass navbar stays: backdrop-blur-md, bg-background/80, bottom hairline.

# 6. COMPONENT RESTYLE (every item)
Button (cva variants):
  primary   = bg ink, text paper, hover: opacity .9 and the trailing arrow icon slides 3px right and turns highlight
  secondary = bg surface, 1px border-strong, hover bg surface-2
  ghost     = transparent, hover bg surface-2
  destructive = 1px ink border, text ink; hover fills ink with paper text (the confirm button in DeleteConfirmDialog is solid ink with a trash icon). NOT red.
  sizes: sm 36, md 44, lg 48. Loading state: spinner in currentColor.
Input / Select / Textarea: height 44, bg surface, 1px border-strong, radius 8; hover border ink at 40%; focus: border ink + 2px highlight ring (offset 2).
  Error: border ink, a 2px highlight bottom line animated scaleX 0 -> 1 (0.25s), icon + message below in --highlight-ink. Label: 12px 500, normal case.
Table: no zebra; hairline row dividers; sticky header with uppercase 11px muted labels; row hover bg surface-2 with a 2px ink bar at the left edge (CSS scaleY); numbers tabular, right-aligned.
Pagination: ghost buttons; active page = ink text + 2px highlight underline (moved with Flip as before); prev/next are secondary.
StatusBadge (monochrome, shape-coded so it works without color):
  active   -> filled ink dot + "Active"
  inactive -> hollow ring dot (1.5px ink at 60%) + "Inactive", muted text
  on_leave -> half-filled dot + "On leave"
  <span style={{ background: status === "on_leave" ? "conic-gradient(var(--foreground) 0 50%, transparent 0)" : status === "active" ? "var(--foreground)" : "transparent",
                 border: status === "active" ? "none" : "1.5px solid var(--foreground)", opacity: status === "inactive" ? .6 : 1 }}
        className="size-2 rounded-full" />
  Badge shell: 1px border, transparent bg, 12px text, radius full, px-2.5 py-1.
DepartmentBadge: neutral outlined pill with the department name only (no color dot).
Avatar: monochrome initials circle. Tone from a name hash over 4 neutral styles: ink bg + paper text | surface-2 bg + ink text | border-strong bg + ink text | transparent + 1px ink border. No gradients (update lib/avatar.ts).
Cards: bg surface, 1px border, radius 12, padding 24. Interactive cards get a bottom underline wipe (section 8) instead of lift + glow.
StatCard: eyebrow label with index ("01 / Total"), big display number, thin icon top-right (muted), a hairline top rule. No colored chips.
Sidebar: bg background, right hairline; logo = serif wordmark + highlight dot; section eyebrows; active item = surface-2 bg + ink text + 2px highlight left bar; icons 1.5 stroke; user card at the bottom with an outline role badge.
Navbar: serif breadcrumb title, mono "/" key hint in a bordered kbd, ThemeToggle, user menu.
Dialog / Sheet: surface, radius 16, 1px border, --shadow-pop, overlay = ink at 50% (blur 2px).
Toasts (Sonner): inverted card (bg ink, text paper; in dark mode bg paper-light). A 2px highlight left edge for errors only; success and info have no color. Icons are thin line icons.
Skeleton: .skeleton class above.
Charts (Recharts, use CSS vars):
  const top = data.reduce((m, d, i, a) => (d.count > a[m].count ? i : m), 0);
  <CartesianGrid stroke="var(--border)" vertical={false} />
  <XAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
  <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={900}>
    {data.map((d, i) => <Cell key={d.department} fill={i === top ? "var(--highlight)" : "var(--foreground)"} fillOpacity={i === top ? 1 : 0.88} />)}
  </Bar>
  Tooltip: bg surface, 1px border, radius 8, mono numbers, no color swatches. Cursor fill: var(--surface-2).
DepartmentBreakdown: track = surface-2, fill = ink, the top department fill = highlight; counts in mono.
EmptyState / 404 / error: giant display "404" with an italic word, a highlight period "." at the end of the headline, thin line illustration (lucide at 1.25 stroke, large, muted).
UsernameField / PasswordStrength: checking = ink spinner, available/current = ink check + "available" text, taken/invalid/reserved = highlight alert icon + --highlight-ink text; strength meter segments are ink (filled) vs border (empty), no colors.

# 7. PAGE-LEVEL DIRECTION
- Login: left panel is ALWAYS black (#0A0A0A) with the paper grain, thin white (8% opacity) concentric rings, a huge serif headline "Manage your people, <em>effortlessly.</em>" in paper white, three feature lines with thin icons, small footer text. Right side: paper form card. Only highlight on this page: the logo dot and one small orbiting dot.
- Dashboard: masthead line (mono eyebrow with the full date) + serif greeting "Good evening, <em>Admin</em>" + double rule. Stat cards use index numerals. Chart + breakdown as above. Recent employees: avatar, name, designation, outline department pill, relative joined date.
- Employees list: title "<em>Employees</em>" with count in mono; toolbar card with hairline separators; filter chips are outlined pills with an x.
- Forms: section cards with eyebrow headings "01 / Personal", "02 / Job", "03 / Compensation"; sticky action bar with a top hairline. Optional login section "04 / Login access".
- Details: large monochrome avatar, serif name, designation muted, ID in a mono bordered chip with copy; info cards with hairline-separated label/value rows.
- /me and /account follow the same patterns.

# 8. ANIMATION RETUNES (keep everything else in the catalog and all useGSAP / reduced-motion rules)
1. Replace "card hover lift + glow" with an UNDERLINE WIPE: each interactive card contains <span data-anim="underline" class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-foreground scale-x-0" />. On mouseenter: gsap.to(span, { scaleX: 1, duration: .35, ease: "power3.out" }); on mouseleave: transformOrigin "right", scaleX 0. Use contextSafe, scoped by ref. (The top department card's underline may use the highlight.)
2. Replace the login "gradient blobs" with RINGS: three absolutely positioned circles (1px white/8% border, sizes 420 / 640 / 860) rotating forever at different speeds (gsap.to rotation 360, ease "none", repeat -1, durations 60 / 90 / 120). Place one 8px highlight dot on the edge of the middle ring so it orbits with it. Wrapped in useMotion (reduced motion: static).
3. Page titles use a masked line reveal. Register SplitText in src/animations/gsap.ts (free since GSAP 3.13): import { SplitText } from "gsap/SplitText"; gsap.registerPlugin(useGSAP, Flip, SplitText); export { SplitText }.
   // src/components/common/PageTitle.tsx
   "use client";
   export function PageTitle({ children }: { children: React.ReactNode }) {
     const ref = useRef<HTMLHeadingElement>(null);
     useMotion(() => {
       SplitText.create(ref.current!, {
         type: "lines", mask: "lines", autoSplit: true,              // re-splits after fonts load and on resize
         onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.08 }),
       });
     }, { scope: ref });
     return <h1 ref={ref} className="font-display text-[34px] leading-[38px] md:text-[44px] md:leading-[48px]">{children}</h1>;
   }
   PageHeader uses PageTitle. Allow <em> inside children (SplitText keeps inline markup).
4. Input error: the highlight underline scaleX 0 -> 1 (0.25s, power3.out) plus the existing 4px shake.
5. Button arrow: on hover the arrow icon x: 0 -> 3 (0.2s, power2.out) and its color tweens to var(--highlight).
6. Sidebar active indicator: same Flip/gsap move as before, but the pill becomes a 2px bar (highlight) + surface-2 background.
7. Count-up numbers: unchanged logic, display font + tabular-nums + min-width in ch.
8. Everything else (entrances, stagger, dialogs, row collapse, empty-state float, toasts) stays unchanged. Do not add new motion beyond this list.

# 9. FILES TO CHANGE
src/app/globals.css  |  src/app/layout.tsx  |  src/animations/gsap.ts (SplitText)  |  src/shared/constants/index.ts (remove DEPARTMENT_COLORS)
src/components/ui/* (button, input, select, table, badge, card, dialog, sheet, dropdown-menu, tooltip, skeleton, sonner)
src/components/common/{Logo,Avatar,ThemeToggle,ConfirmDialog,ErrorState,CopyButton,PageTitle(new)}.tsx
src/components/layout/{Sidebar,Navbar,MobileNav,UserMenu,PageHeader}.tsx
src/features/auth/components/{BrandPanel,LoginForm}.tsx
src/features/dashboard/components/{StatCard,StatsGrid,DepartmentChart,DepartmentBreakdown,RecentEmployees,DashboardSkeleton}.tsx
src/features/employees/components/{StatusBadge,DepartmentBadge,EmployeeTable,EmployeeCard,Pagination,FilterChips,EmptyState,EmployeeForm,FormSection,EmployeeDetails}.tsx
src/features/employee-access/**, src/features/account/**, src/features/me/**, src/components/forms/**
src/lib/avatar.ts
src/app/{not-found,error,loading}.tsx and src/app/(dashboard)/employees/[id]/not-found.tsx
Do not touch server/, shared/schemas, API routes or hooks (except removing color imports).

# 10. ACCEPTANCE CHECKLIST (verify against the real code)
[ ] grep finds NO hardcoded colors in components (only tokens), no indigo/teal/violet/green/amber/red classes, no gradients except the CSS shimmer and the status half-dot
[ ] The highlight appears only where section 4 allows; at most 3 static highlight touches per viewport on every page (check dashboard, list, form, details, login, /account)
[ ] Light and dark are both polished; the theme persists with no flash; contrast >= 4.5:1 for text (highlight text uses --highlight-ink)
[ ] Status is understandable without color (dot shapes + labels); errors always have an icon + text
[ ] Fonts load via next/font only (Instrument Serif, Geist, Geist Mono), display: swap, no layout shift; titles are serif, UI is sans, IDs/usernames are mono
[ ] Stat numbers do not jitter during count-up
[ ] Page titles use the masked line reveal and do not replay on refetch; reduced motion shows static content
[ ] Chart: ink bars + ONE highlight bar; the breakdown's top bar is the only highlighted fill
[ ] Login panel: black, rings rotating, one orbiting highlight dot; works with reduced motion off
[ ] Focus ring visible on every interactive element (highlight); keyboard and screen-reader behavior unchanged
[ ] No layout or alignment regressions at 360 / 768 / 1280 px
[ ] typecheck, lint and build pass; Lighthouse accessibility >= 95