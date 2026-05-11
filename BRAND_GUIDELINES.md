# Mr Brush & Co. — Brand & Design Guidelines

> **Purpose:** This document defines the visual language, component patterns, and role-based colour systems for the Mr Brush & Co. operations app. All three app surfaces — Cleaner, Supervisor, and Manager/Client — share the same layout architecture, component library, and typographic system. They are differentiated exclusively by their accent colour token.

---

## 1. Brand Identity

| | |
|---|---|
| **Company name** | Mr Brush & Co. |
| **Product name** | Mr Brush Operations |
| **Brand personality** | Professional, dependable, clean. Premium without being cold. Built for people who work with their hands. |
| **Tagline** | *Cleaning Operations, Verified.* |

---

## 2. Colour System

### 2.1 Shared Foundation (all roles)

These colours never change regardless of which side of the app is open.

| Token | Hex | Usage |
|---|---|---|
| `--charcoal` | `#1A1C19` | Primary text, headings, dark UI elements |
| `--slate` | `#434844` | Secondary text, icons, labels |
| `--ivory` | `#F4F4EE` | Page background |
| `--ivory-light` | `#FAFAF4` | Form / submission screen background |
| `--card-border` | `#D0CFCA` | Card outlines, dividers |
| `--divider` | `#E3E3DD` | Subtle separators within cards |
| `--muted-text` | `#8A8A8A` | Timestamps, metadata |
| `--deep-green` | `#2F4A3D` | Success states, completed badges (universal) |
| `--success-bg` | `#D7E6DB` | Completed badge background |
| `--danger` | `#BA1A1A` | Error states, urgent alerts, unread dots |
| `--danger-bg` | `#FDECEA` | Alert avatar background |
| `--warm-tan` | `#6B5D36` | Warm label text on ivory backgrounds |
| `--gold-border` | `#D7C596` | Shimmer/highlight borders on dark screens |

### 2.2 Role Accent Colours

Each role has one accent colour that replaces `--accent` and `--accent-hover` throughout. Every button, active nav item, selected state, progress bar fill, and avatar background for unread items uses the role accent.

#### Cleaner — Muted Brass

> **Feeling:** Warm, approachable, hardworking. Crafted for field workers in practical environments.

| Token | Hex |
|---|---|
| `--accent` | `#B8A77A` |
| `--accent-hover` | `#A8976A` |
| `--accent-bg` | `#F1DEAD` |
| `--accent-bg-border` | `#D7C596` |
| `--accent-text` | `#6F613A` |

#### Supervisor — Steel Blue

> **Feeling:** Authoritative, analytical, oversight-oriented. Distinct from the cleaner surface at a glance.

| Token | Hex |
|---|---|
| `--accent` | `#4E6B8E` |
| `--accent-hover` | `#3E5A7A` |
| `--accent-bg` | `#DDE7F2` |
| `--accent-bg-border` | `#A8C0D6` |
| `--accent-text` | `#2A4A68` |

#### Manager / Client — Deep Indigo

> **Feeling:** Premium, executive, client-facing trust. The view a paying client sees: polished and confident.

| Token | Hex |
|---|---|
| `--accent` | `#3B4F7C` |
| `--accent-hover` | `#2C3D66` |
| `--accent-bg` | `#DDE1EE` |
| `--accent-bg-border` | `#A4AECB` |
| `--accent-text` | `#1E2F56` |

### 2.3 Role Application Examples

| Element | Cleaner | Supervisor | Manager |
|---|---|---|---|
| Primary button | `#B8A77A` | `#4E6B8E` | `#3B4F7C` |
| Active nav pill | `#B8A77A` | `#4E6B8E` | `#3B4F7C` |
| Progress bar fill | `#F1DEAD` | `#DDE7F2` | `#DDE1EE` |
| Unread card background | `#F1DEAD` | `#DDE7F2` | `#DDE1EE` |
| Initials avatar (unread) | `#B8A77A` | `#4E6B8E` | `#3B4F7C` |
| Selected state (language, etc.) | `#B8A77A` | `#4E6B8E` | `#3B4F7C` |

---

## 3. Typography

### 3.1 Typefaces

| Role | Font | Weights used | Purpose |
|---|---|---|---|
| Heading | **Poppins** | 700 (Bold), 600 (SemiBold) | All headings, screen titles, button labels, card titles |
| Body | **Lato** | 400 (Regular), 700 (Bold) | Body copy, labels, metadata, descriptions, badges |

Both fonts load from Google Fonts. Self-hosted copies live in `src/assets/fonts/`.

### 3.2 Type Scale

| Label | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `display` | 48px | Bold | Poppins | Shift Completed celebration heading |
| `h1` | 42px | Bold | Poppins | Page headings (Notifications, Shift History) |
| `h2` | 32px | SemiBold | Poppins | Section headings (Home greeting, ZoneList) |
| `h3` | 26px | Bold | Poppins | Notification detail subject |
| `h4` | 24px / text-2xl | SemiBold | Poppins | Card titles, zone names, job site names |
| `body-lg` | 15px | Regular | Lato | Message body, notification detail paragraphs |
| `body` | 14–15px | Regular | Lato | Standard body copy |
| `label` | 13–14px | Bold | Lato | Badges, timestamps, metadata, uppercase labels |
| `micro` | 10–11px | Bold | Lato | Tracking labels (stats bubbles, nav items) |

### 3.3 Heading Consistency Rule

Every **full-page list screen** (Notifications, Shift History) uses:
```
font: Poppins Bold 42px
tracking: -0.5px
line-height: 1.1
color: #1A1C19
```
Followed immediately by a `15px Lato` subtitle line in `#434844`.

Every **progress / detail screen** (Shift Progress, Zone Submission header) uses:
```
font: Poppins SemiBold 32px
tracking: -0.32px
color: #1A1C19
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

The app uses Tailwind's default 4px base unit. Key spacings:

| Value | px | Common usage |
|---|---|---|
| `gap-2` | 8px | Within a label cluster |
| `gap-3` | 12px | Between avatar and text |
| `gap-4` | 16px | Between cards in a list |
| `gap-6` | 24px | Between page sections |
| `gap-8` | 32px | Major content blocks |
| `px-6` | 24px | Standard horizontal page padding |
| `px-8` | 32px | Wider form screen padding |
| `pt-10` | 40px | Top inset for large-heading screens |
| `pb-[100px]` | 100px | Bottom clearance for BottomNav |

### 4.2 Page Layout

All screens use the same two-element shell:

```
<div class="fixed inset-0 bg-[--ivory] overflow-y-auto">       ← Full-bleed scroll container
  <div class="w-full max-w-[480px] mx-auto pb-[100px]">        ← Content column, centred
    ...content...
  </div>
  <BottomNav />                                                 ← Fixed to viewport bottom
</div>
```

**Why `fixed inset-0 overflow-y-auto` (not flex)?**
Using `flex justify-center` on the outer container forces `align-items: stretch`, which pins the inner div to 100vh and prevents scrolling. The correct pattern is no flex on the outer wrapper — use `mx-auto` on the inner column for centering.

### 4.3 Max Widths

| Context | Max width |
|---|---|
| All cleaner screens | 480px |
| Zone submission form | 576px |
| No-photo note form | 672px |
| Desktop: content column centred | 480px on a full-bleed `#F4F4EE` background |

On screens wider than 480px, the content column centres and the ivory background fills the full viewport. No sidebar, no two-column layout — the mobile layout simply centres at any width.

### 4.4 Z-Index Stack

| Layer | z-index | Element |
|---|---|---|
| Offline banner | 200 | `GlobalOfflineBanner` (App.tsx) |
| Sticky page headers | 10 | Notification detail header, ZoneList — none currently sticky |
| Language dropdown | 50 | Home language picker |
| Fixed submit bar | 50 | ZoneSubmission bottom CTA |
| BottomNav | 50 | Always on top of content |

---

## 5. Component Library

### 5.1 Buttons

#### Primary Button
```
height: 56px (h-[56px])
border-radius: 12px
font: Poppins SemiBold 16px
color: #F8F8F2 (off-white)
background: --accent
hover: --accent-hover
disabled: --accent at 50% opacity, cursor-not-allowed
```

#### Ghost / Outline Button (dark screens)
```
height: 56px
border-radius: 12px
border: 2px solid --gold-border (#D7C596)
font: Poppins SemiBold 16px
color: --gold-border
background: transparent
hover: --gold-border at 10% opacity
```
Used on the ShiftCompleted screen over the dark green background.

#### Text Button / Link
```
font: Lato Bold 14px
tracking: 0.7px
color: #434844
text-decoration: underline
decoration-color: #C3C8C2
```
Used for "I can't submit a photo" in ZoneSubmission.

### 5.2 Cards

#### Standard Job / Shift Card
```
background: white
border: 1px solid #C3C8C2
border-radius: 12px
padding: 21px
shadow: none → shadow-md on hover
```

#### Unread Notification Card
```
background: --accent-bg
border: 1px solid --accent-bg-border at 60% opacity
border-radius: 12px
padding: 16px
```

#### Urgent Notification Card
```
background: white
border: 2px solid #1A1C19
border-radius: 12px
padding: 16px
```

#### Instruction Block (inside notification)
```
background: #FAFAF6
border: 1px solid #D0CFCA
border-radius: 8px
padding: 16px
```

### 5.3 Badges / Pills

| Type | Background | Text colour | Usage |
|---|---|---|---|
| In Progress | `--accent-bg` | `--accent-text` | Job/zone in-progress state |
| Not Started | `#E3E3DD` | `#434844` | Zones not yet touched |
| Completed | `#D7E6DB` | `#2F4A3D` | Shift history, completed zones |
| Incomplete | `#E3E3DD` | `#737874` | Incomplete shift in history |
| URGENT | `#BA1A1A` | white | Urgent notification |

All badges: `font: Lato Bold 13–14px, tracking: 0.65–0.7px, uppercase, height: 28–32px, border-radius: full`

### 5.4 Stat Bubbles

```
size: 48×48px (w-12 h-12)
shape: circle
border: 2px solid {ring colour}
  black ring   → active/filled
  --accent-bg  → partial
  #C3C8C2      → empty/inactive
inner text: Poppins SemiBold 15px, black
label below: Lato Bold 10px, uppercase, tracking-[0.5px], --warm-tan
```

### 5.5 Inputs

```
height: 52px (h-[52px]) for single-line
border: 1px solid #737874
border-radius: 6px
padding: 12px 16px
font: Lato Regular 16px
color: #434844
placeholder: #9E9E9E
focus border: --accent
shadow: shadow-sm
```

Textarea (multi-line notes):
```
border-radius: 6px (same)
padding: 16px
resize: none
rows: 3–5
```

### 5.6 Progress Bar

```
track: w-full h-3 bg-[#C3C8C2] rounded-full overflow-hidden
fill: h-full bg-[--accent-bg] rounded-full transition-all duration-500
```

Note: the fill uses `--accent-bg` (the lighter tint), not the accent itself. This keeps it soft.

### 5.7 Avatar Initials

```
shape: circle
sizes: w-9 h-9 (sm, sticky header), w-10 h-10 (card), w-12 h-12 (detail)
background: --accent (unread/active) or #434B4D (read/inactive)
font: Poppins SemiBold, text-sm/text-base
color: white
```

System alert avatar:
```
background: #FDECEA
border: 1px solid #F5C6C6
icon: AlertSvg in #BA1A1A
```

### 5.8 Bottom Navigation

```
container: fixed bottom-0, max-w-[480px] centred
background: white
border-top: 1px solid #C3C8C2
padding: pt-[17px] pb-4 px-4
z-index: 50

NavItem active:
  background: --accent
  label: #F8F8F2

NavItem inactive:
  background: transparent
  label: #434844

icon: 18×18–20px inline SVG, stroke matches label colour
label: Lato Bold 14px, tracking-[0.7px]
```

### 5.9 Offline Banner

```
background: #BA1A1A
padding: 10px 16px
font: Lato Bold 13px
color: white
position: fixed top-0 z-[200]
```

### 5.10 Language Dropdown

```
trigger: 40×40px circle, white, border border-[#C3C8C2], shadow-sm
icon: GlobeIcon 18×18px stroke #434844
dropdown: white, border border-[#D0CFCA], border-radius 12px, shadow-lg
item: px-4 py-3, hover bg-[#F4F4EE]
  flag: 18px emoji
  label: Poppins SemiBold 14px
  checkmark (active): SVG in --accent
```

---

## 6. Icon Style

All icons are inline SVG — no icon font, no external library. This ensures zero flash-of-missing-icon and full colour control.

**Rules:**
- Stroke-based, not filled (exception: small dot indicators, filled circles)
- `strokeWidth`: 1.5 for detail icons, 2 for navigation and action icons, 2.5 for emphasis (checkmarks)
- `strokeLinecap`: `round`
- `strokeLinejoin`: `round`
- `aria-hidden="true"` on every decorative icon
- Size: 16–22px for inline, 18px for nav, 28px for primary actions

**Icon colours:**
- `#1A1C19` — back arrows, primary UI icons
- `#434844` — secondary icons (clock, info)
- `#434B4D` — inactive nav icons
- `#F8F8F2` — icons on dark/accent backgrounds
- `--accent-text` — icons within branded badges

---

## 7. Standard Page Patterns

### Pattern A — Large-Heading List Screen
*(Notifications, Shift History)*

```
fixed inset-0 overflow-y-auto
└── max-w-[480px] mx-auto pb-[100px]
    ├── pt-10 pb-5 px-6
    │   ├── h1: Poppins Bold 42px          ← screen title
    │   └── p: Lato 15px #434844           ← subtitle
    ├── content area (px-6, flex flex-col gap-3/4)
    │   └── cards / list items
    └── EndOfFeed / empty state
└── BottomNav
```

### Pattern B — Progress / Work Screen
*(Home, ZoneList)*

```
fixed inset-0 overflow-y-auto
└── max-w-[480px] mx-auto pb-[100px]
    ├── pt-8 px-6 — greeting or back+heading row
    │   └── h2: Poppins SemiBold 32px
    ├── stats or progress bar row
    ├── section label (Poppins SemiBold 24px)
    └── card list (px-6, gap-4)
└── BottomNav
```

### Pattern C — Form / Submission Screen
*(ZoneSubmission, NoPhotoNote)*

```
fixed inset-0 overflow-y-auto
└── max-w-[576px] mx-auto
    ├── sticky top-0 h-16 header row
    │   └── back button + centred title
    ├── instruction card
    ├── input area (photo grid / textarea)
    └── pb-36 bottom clearance
└── fixed bottom submit bar (gradient fade)
    └── Primary Button
```

### Pattern D — Detail / Message Screen
*(NotificationDetail)*

```
fixed inset-0 overflow-y-auto
└── max-w-[480px] mx-auto pb-12
    ├── sticky header: back label + sender avatar
    ├── sender info row (large avatar + name/role/date)
    ├── horizontal rule
    ├── h1: Poppins Bold 26px (subject)
    └── white card: body paragraphs + instruction block + signature
    └── attachments section (if present)
```

### Pattern E — Celebration / Completion Screen
*(ShiftCompleted)*

```
min-h-screen bg-[#111E17] flex items-center justify-center p-6
└── max-w-[480px] flex flex-col items-center gap-8
    ├── concentric ring checkmark
    ├── display heading (Poppins Bold 48px, white)
    ├── subtitle (Lato 20px, --gold-border)
    ├── timestamp row
    ├── frosted confirmation card (white/7%)
    └── Ghost button + text button
```

---

## 8. Motion & Animation

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Page enter | 450ms | `ease-out` | `opacity 0→1 + translateY 18px→0` via `page-enter` keyframe |
| Progress bar fill | 500ms | `transition-all` | Smooth fill on zone completion |
| Button colour | 150ms | `transition-colors` | Hover/active states |
| Card shadow | 150ms | `transition-shadow` | Cards lift on hover |
| Dropdown open | instant | — | No animation needed; small, nearby element |
| Splash logo rise | 1250ms | `ease-out` | `logo-rise` keyframe |
| Splash bubbles | 2800ms | `ease-in-out` | Looping `splash-bubble-a/b` |
| Wash bubbles | 1700–2500ms | `ease-in` | `bubble-rise` + `bubble-sway` |
| Sparkle ring | 900ms | `ease-in-out` | Infinite `sparkle` keyframe |

---

## 9. Role Differentiation Guide

All three app surfaces share:
- Identical layout shell and page patterns
- Identical component shapes, sizes, and border radii
- Identical typography scale
- Identical spacing system
- Identical icon style

They differ **only** in:
- Accent colour (primary button, nav active, progress fill, unread state, selected states)
- The role identifier shown post-login (determined by ID prefix: C / S / M)
- The screens available in the routing tree (`/cleaner/*`, `/supervisor/*`, `/manager/*`)

### Implementing a new role surface

1. Copy the Tailwind `--accent` token value and substitute the role's accent hex
2. Import and use `useTranslation()` for all UI strings
3. Follow the page patterns above — do not invent new layouts
4. Use the same `BottomNav` component with role-appropriate tabs
5. The dark `#1A1C19` and ivory `#F4F4EE` base colours never change

### Visual identity at a glance

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CLEANER        │  │  SUPERVISOR      │  │  MANAGER/CLIENT │
│                 │  │                 │  │                 │
│  Accent:        │  │  Accent:        │  │  Accent:        │
│  ████ #B8A77A  │  │  ████ #4E6B8E  │  │  ████ #3B4F7C  │
│  Muted Brass    │  │  Steel Blue     │  │  Deep Indigo    │
│                 │  │                 │  │                 │
│  Warm, trusted  │  │  Analytical,    │  │  Executive,     │
│  field worker   │  │  authoritative  │  │  client-facing  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
       ↑                     ↑                     ↑
  Already built          Next phase           Final phase
```

---

## 10. Accessibility

- Minimum contrast target: 4.5:1 for body text (WCAG AA)
- All interactive elements have `aria-label` when text label is absent
- `aria-hidden="true"` on all decorative SVG icons
- `aria-pressed` on toggle/selection buttons (language selector)
- Focus states: browser default preserved (do not set `outline: none` without replacement)
- Touch targets: minimum 44×44px for all tappable elements

---

## 11. Do Not

- Do not use `flex justify-center` on page wrappers — this breaks scrolling (see §4.2)
- Do not hardcode English strings in components — use `useTranslation()`
- Do not approximate brand colours — use exact hex values from §2
- Do not create new layout patterns before checking against §7
- Do not change the `fixed inset-0 overflow-y-auto` page shell
- Do not introduce new fonts — Poppins + Lato only
- Do not use shadow larger than `shadow-md` on cards
- Do not use border-radius other than `rounded-full` (pills), `rounded-[6px]` (inputs), `rounded-[8px]` (inner blocks), `rounded-[12px]` (cards, buttons)

---

*Last updated: May 2026 — reflects Cleaner side MVP (all screens built and committed).*
*Supervisor and Manager surfaces: layout-ready, pending feature build-out.*
