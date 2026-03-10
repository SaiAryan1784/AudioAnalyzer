# AudioAnalyzer — Brand Guidelines v1.0
> Precision. Amplified.

---

## 01 · Brand Essence

**The concept:** AudioAnalyzer sits at the intersection of scientific precision and human coaching. It should feel like a brilliant colleague — analytical, direct, and genuinely useful. Like a great sports coach: honest, focused, and motivating.

| Pillar | Expression |
|--------|-----------|
| **Tone** | Clinical Clarity — data-driven and precise, never cold |
| **Personality** | Sharp Intelligence — confident and fast, no fluff |
| **Promise** | Visible Growth — every analysis makes the user feel coached, not judged |

---

## 02 · Color System

> Rooted in deep obsidian dark with one electric signal accent. The yellow-green evokes an oscilloscope — technical precision that glows.

### Primary

| Name | Hex | Role |
|------|-----|------|
| **Signal** | `#E8FF47` | Primary accent · CTAs · Active states |
| **Void** | `#06080F` | Page background |
| **Surface** | `#0D1020` | Cards · Panels |
| **Surface 2** | `#141826` | Inputs · Inner elements |
| **Bone** | `#F0EDE8` | Primary text |

### Semantic

| Name | Hex | Role |
|------|-----|------|
| **Pulse** | `#2EE8A4` | Scores · Positive · Improving trends |
| **Alert** | `#FF4757` | Errors · Low scores · Warnings |
| **Dimension** | `#4B8BF5` | D-badges · Tags · Links |
| **Muted** | `#6B7A99` | Secondary text · Labels · Placeholders |
| **Subtle** | `#3A4260` | Disabled · Dividers · Hints |

### Borders & Overlays

```
Card borders:    1px solid rgba(232, 255, 71, 0.10)
Accent borders:  1px solid rgba(232, 255, 71, 0.30)
Input borders:   1px solid rgba(240, 237, 232, 0.12)
Input focus:     1px solid rgba(232, 255, 71, 0.50)
                 box-shadow: 0 0 0 3px rgba(232, 255, 71, 0.08)
```

### Score Color Logic

```
Score ≥ 7.0  →  Pulse  (#2EE8A4)
Score 5–6.9  →  Signal (#E8FF47)
Score < 5.0  →  Alert  (#FF4757)
```

---

## 03 · Typography

> Three typefaces. Each with a specific role. Never mix roles.

### Display — Bricolage Grotesque
**Source:** Google Fonts (free)  
**Use for:** All headings, page titles, card titles, hero text

```
H1:  800 weight · font-size clamp(42px, 6vw, 72px) · letter-spacing -0.04em · line-height 1.0
H2:  700 weight · font-size clamp(28px, 3vw, 38px) · letter-spacing -0.03em · line-height 1.15
H3:  600 weight · font-size 22px                   · letter-spacing -0.02em · line-height 1.2
```

**Example:** `"What are you analyzing today?"`

---

### Body — IBM Plex Sans
**Source:** Google Fonts (free)  
**Use for:** All body copy, UI labels, buttons, descriptions, form fields

```
Large body:  400 weight · 17px · line-height 1.65
Body:        400 weight · 15px · line-height 1.6
Small:       400 weight · 13px · line-height 1.55
Label:       500 weight · 12px · letter-spacing 0.02em
Uppercase:   500 weight · 11px · letter-spacing 0.08em · text-transform uppercase
```

---

### Mono — JetBrains Mono
**Source:** Google Fonts (free)  
**Use for:** Scores, dates, hex values, dimension tags, code, counters

```
Score large:  700 weight · 24–32px
Score inline: 700 weight · 16–18px
Tag/Badge:    400 weight · 11–12px · letter-spacing 0.04em
Code:         400 weight · 13px
```

**Examples:** `8.5 / 10` · `#E8FF47` · `17 min` · `Mar 10, 2026` · `D1` · `∞ Unlimited`

---

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
```

### CSS Variables

```css
--font-display: 'Bricolage Grotesque', sans-serif;
--font-body:    'IBM Plex Sans', sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

---

## 04 · Logo & Favicon

### The Mark

The icon is a **spectrum analyzer** — 4 frequency bars of varying heights in Signal yellow on a dark rounded square. It is geometric, minimal, and instantly recognisable at any size.

```
Bar heights (base unit):  9px · 16px · 11px · 7px
Bar width:                4–5px per bar, gap 3–4px
Bar color:                #E8FF47
Background:               #0D1020
Background radius:        22% of icon size (e.g. 14px at 64px)
Bar border-radius:        2px
```

### Size Reference

| Size | Border Radius | Bar Width | Gap |
|------|--------------|-----------|-----|
| 64px | 14px | 5px | 4px |
| 32px | 7px  | 3px | 2px |
| 16px | 4px  | 1px | 1px |

### Wordmark

```
Font:    Bricolage Grotesque
Weight:  700
Size:    18–20px
Spacing: letter-spacing -0.03em
Color:   #F0EDE8 (on dark) · #0D1020 (on light/accent)
```

**Full lockup:** `[icon] AudioAnalyzer` — icon and wordmark always appear together in the nav. Icon-only allowed only at favicon sizes.

### Usage Contexts

| Background | Icon bg | Bar color | Text color |
|-----------|---------|-----------|-----------|
| Dark (#06080F) | #0D1020 | #E8FF47 | #F0EDE8 |
| Light (#F0EDE8) | #0D1020 | #E8FF47 | #0D1020 |
| Signal (#E8FF47) | #0D1020 | #E8FF47 | #0D1020 |

---

## 05 · Component Language

### Buttons

```css
/* Primary */
background:    #E8FF47;
color:         #06080F;
font:          IBM Plex Sans 600 · 14–15px;
padding:       12–14px 24px;
border-radius: 10px;
hover:         background #f5ff70; transform translateY(-1px);

/* Secondary */
background:    transparent;
color:         #F0EDE8;
border:        1px solid rgba(240,237,232,0.20);
border-radius: 10px;
hover:         border-color rgba(240,237,232,0.40);

/* Ghost (accent-tinted) */
background:    transparent;
color:         #E8FF47;
border:        1px solid rgba(232,255,71,0.30);
border-radius: 10px;
hover:         background rgba(232,255,71,0.06);
```

### Badges & Tags

```css
/* Accent badge */
background: rgba(232,255,71,0.15);
color:      #E8FF47;
border:     1px solid rgba(232,255,71,0.25);
font:       JetBrains Mono 400 · 11px;
padding:    4px 10px;
radius:     20px;

/* Teal badge (positive) */
background: rgba(46,232,164,0.10);
color:      #2EE8A4;
border:     1px solid rgba(46,232,164,0.20);

/* Alert badge */
background: rgba(255,71,87,0.10);
color:      #FF4757;
border:     1px solid rgba(255,71,87,0.20);

/* Dimension tag (D1, D2...) */
background: #1a2340;
color:      #4B8BF5;
font:       JetBrains Mono 700 · 11px;
padding:    4px 9px;
radius:     6px;
```

### Input Fields

```css
background:    #141826;
border:        1px solid rgba(240,237,232,0.12);
border-radius: 10px;
padding:       14px 16px;
font:          IBM Plex Sans 400 · 14px · color #F0EDE8;
placeholder:   color #3A4260;

/* Focus state */
border-color:  rgba(232,255,71,0.50);
box-shadow:    0 0 0 3px rgba(232,255,71,0.08);
transition:    all 150ms ease-out;
```

### Cards

```css
background:    #0D1020;
border:        1px solid rgba(232,255,71,0.10);
border-radius: 16px;
padding:       28px;

/* Hover (interactive cards) */
border-color:  rgba(232,255,71,0.22);
transform:     translateY(-2px);
transition:    all 150ms ease-out;
```

### Score Display

```css
font:          JetBrains Mono 700 · 22–28px;
padding:       8px 18px;
border-radius: 10px;

/* States mapped to score color logic above */
```

---

## 06 · Spacing & Radius

### Spacing Scale (base: 4px)

| Token | Value | Usage |
|-------|-------|-------|
| `xs`  | 4px   | Icon gaps, tight pairs |
| `sm`  | 8px   | Badge padding, inline gaps |
| `md`  | 12px  | Button padding block |
| `lg`  | 16px  | Grid gaps, card gaps |
| `xl`  | 24px  | Card padding, section gaps |
| `2xl` | 32px  | Section internal padding |
| `3xl` | 48px  | Section vertical margin |
| `4xl` | 64px  | Page top padding |
| `5xl` | 80px  | Section-to-section gap |
| `6xl` | 100px | Major section breaks |

### Border Radius Scale

| Context | Value |
|---------|-------|
| Badges / pills | 999px |
| Buttons / inputs | 10px |
| Cards | 16px |
| Modals / large panels | 20px |
| Favicon / app icon | 22% of size |

---

## 07 · Motion Principles

> Motion must feel precise and confident — like instruments on a dashboard. Never bouncy. Never whimsical.

| Name | Duration | Easing | Use |
|------|----------|--------|-----|
| Micro | 150ms | ease-out | Hover states, button press, badge fades |
| Standard | 280ms | ease-in-out | Route changes, panel reveals, modal entry |
| Data | 600ms | ease-out | Score reveals, graph draws, radar fills |
| Stagger offset | 60ms per item | — | Card grids animating in |
| Custom ease | `cubic-bezier(0.16, 1, 0.3, 1)` | — | All expanding/entering elements |

```css
/* Card hover */
transform: translateY(-2px) scale(1.01);
transition: all 150ms ease-out;

/* Page load stagger */
animation-delay: calc(var(--index) * 60ms);
```

---

## 08 · Do's and Don'ts

### ✅ Do

- Use **Bricolage Grotesque** for all headings at weight 700+
- Use **Signal (#E8FF47)** sparingly — primary CTAs and active states only
- Use **JetBrains Mono** for all numbers, scores, dates, and hex values
- Keep cards on Surface (`#0D1020`), not directly on the page background
- Use **Pulse (#2EE8A4)** for positive scores and improving trends
- Maintain `letter-spacing: -0.03em` or tighter on all display type
- Use 1px borders at ~10% Signal opacity for standard card borders
- Allow generous negative space — the dark background is part of the design
- Write button labels as verbs: "Analyze Audio", "View History", "Sign in"

### ❌ Don't

- Never use Inter, Roboto, system-ui, or Arial — they break brand voice
- Never use generic blue-purple gradients as backgrounds
- Never place white or light text directly on Signal (#E8FF47) — only use Void (`#06080F`)
- Never use more than 2 accent colours on a single surface
- Never use border-radius above 20px on cards or panels
- Never use bouncy/spring animations — precision only
- Never use opaque box shadows — use glow effects (box-shadow with low-opacity accent) instead
- Never stack more than 3 font weights on a single screen
- Never use Signal as a background fill on large areas

---

## 09 · Login & Signup Redesign Prompt

> Copy this prompt in full into Cursor, Windsurf, or any AI IDE to rebuild the auth pages with full brand fidelity.

---

```
Redesign the Login and Signup pages for AudioAnalyzer using the following brand system.

━━━ BRAND TOKENS ━━━

Fonts (import from Google Fonts):
  Display/Headings:  Bricolage Grotesque — weight 700/800, letter-spacing -0.03em to -0.04em
  Body/Labels:       IBM Plex Sans — weight 400/500/600
  Data/Codes:        JetBrains Mono — weight 400/500/700

Colors (CSS variables):
  --bg:           #06080F    /* page background */
  --surface:      #0D1020    /* card background */
  --surface-2:    #141826    /* input/inner background */
  --accent:       #E8FF47    /* primary CTA — Signal yellow-green */
  --teal:         #2EE8A4    /* success / positive */
  --text:         #F0EDE8    /* primary text */
  --muted:        #6B7A99    /* secondary text, placeholders */
  --subtle:       #3A4260    /* disabled / dividers / hints */
  --border:       rgba(232,255,71,0.10)
  --input-border: rgba(240,237,232,0.12)

━━━ LAYOUT ━━━

Full-screen split layout — use the entire viewport, no small centered modal card.

Left panel (40% width) — Brand showcase:
  - Background: #0D1020
  - A vertical spectrum-bar SVG illustration using #E8FF47 bars of varying
    heights to create an audio waveform visualization (decorative, full height)
  - 4 feature highlights with simple icons:
      🎯  "5 analysis frameworks"
      📊  "Dimensional scoring 1–10"
      📈  "Progress tracking over time"
      ⚡  "Instant AI feedback"
  - Feature text: IBM Plex Sans 14px, color #6B7A99
  - Bottom tagline: "Used by 2,000+ professionals"
    (Bricolage Grotesque 700, 16px, color #F0EDE8)
  - Subtle noise texture overlay at 4% opacity for depth

Right panel (60% width) — Auth form:
  - Background: #06080F
  - Centered content column, max-width 420px
  - Padding: 80px top/bottom, 48px sides

━━━ FORM DESIGN ━━━

Logo lockup at top of form:
  - Spectrum icon: 4 bars (heights 9,16,11,7 — color #E8FF47) on #0D1020
    rounded rect (border-radius 10px), size 36×36px
  - "AudioAnalyzer" in Bricolage Grotesque 700, 18px, beside it
  - Margin-bottom: 40px

Heading:
  - LOGIN:   "Welcome back"     — Bricolage Grotesque 800, 36px, -0.04em ls
  - SIGNUP:  "Start analyzing"  — same style
  - Sub:     IBM Plex Sans 15px, color #6B7A99, margin-top 8px

Google OAuth button:
  - Background: #141826
  - Border: 1px solid rgba(240,237,232,0.15)
  - Full width, height 50px, border-radius 10px
  - Google "G" SVG logo left-aligned with 16px left padding
  - Text: IBM Plex Sans 500, "Continue with Google", color #F0EDE8, centered
  - Hover: border-color rgba(232,255,71,0.30), background #1a2034
  - Transition: all 150ms ease-out

Divider: "OR CONTINUE WITH EMAIL"
  - JetBrains Mono 10px, letter-spacing 0.12em, color #3A4260
  - Two 1px horizontal lines either side, color #3A4260 at 50% opacity
  - Margin: 28px top and bottom

Input field anatomy:
  - Label: IBM Plex Sans 500, 11px, letter-spacing 0.08em, uppercase, color #6B7A99
  - Input: background #141826, border 1px solid rgba(240,237,232,0.12)
  - Border-radius 10px, padding 14px 16px
  - Font: IBM Plex Sans 400, 14px, color #F0EDE8
  - Placeholder: color #3A4260
  - Focus: border 1px solid rgba(232,255,71,0.50),
           box-shadow 0 0 0 3px rgba(232,255,71,0.08)
  - Transition: all 150ms ease-out
  - Gap between fields: 20px

Primary button (Sign in / Create account):
  - Background: #E8FF47
  - Color: #06080F
  - Font: IBM Plex Sans 600, 15px
  - Full width, height 50px, border-radius 10px
  - Hover: background #f5ff70, transform translateY(-1px)
  - Active: transform translateY(0)
  - Transition: all 150ms ease-out
  - No box-shadow

Footer link below button:
  - IBM Plex Sans 14px, color #6B7A99
  - Anchor: color #E8FF47, font-weight 500
  - Example: "Don't have an account? Sign up"
  - Margin-top: 24px, text-align center

━━━ SIGNUP SPECIFIC ━━━

Field order: NAME → EMAIL → PASSWORD

Password hint beneath field:
  - IBM Plex Sans Italic 12px, color #3A4260
  - Text: "Min 8 characters"

Password strength indicator (below hint):
  - 3 equal-width segments in a row, height 3px, gap 4px, border-radius 2px
  - Weak:   first segment #FF4757, rest #1a2340
  - Medium: first two #E8FF47, last #1a2340
  - Strong: all three #2EE8A4
  - Transition: background-color 200ms ease-out

━━━ ANIMATIONS ━━━

Page load:
  - Left panel: fade + slide from left, 400ms ease-out, starts at opacity 0 translateX(-20px)
  - Right panel form elements: stagger-in from below
    each item: opacity 0 → 1, translateY(12px) → 0
    duration 280ms ease-out, delay: index × 60ms

Input focus transition: 150ms ease-out on border and box-shadow
Button hover: 150ms ease-out on background + transform

━━━ MOBILE (below 768px) ━━━

- Hide left panel entirely
- Right panel becomes full-width
- Add centered brand bar at very top: logo icon + "AudioAnalyzer" wordmark
- Reduce heading to 28px
- Reduce horizontal padding to 24px

━━━ ACCESSIBILITY ━━━

- All inputs have <label for="..."> or aria-label
- Focus rings: outline 3px solid rgba(232,255,71,0.40), outline-offset 2px
- Color contrast: #E8FF47 on #06080F passes WCAG AA
- Keyboard navigable in logical DOM order
- Password field has type="password" with toggle show/hide button

━━━ DO NOT ━━━

- Do not use Inter, Roboto, Arial, or any system font
- Do not use a small centered modal card for the layout — use the full split viewport
- Do not use purple, indigo, or violet anywhere
- Do not add drop shadows to cards or buttons
- Do not deviate from the color tokens defined above
```

---

*AudioAnalyzer Brand Guidelines v1.0 · March 2026*
