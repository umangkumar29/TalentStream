---
name: Precision Enterprise SaaS
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  container-max-width: 1440px
---

## Brand & Style

This design system is engineered for a high-fidelity enterprise environment, focusing on the sophisticated needs of AI-driven talent resourcing. The brand personality is authoritative yet unobtrusive, prioritizing data density and clarity over decorative elements. It evokes a sense of "technical intelligence"—where the UI recedes to let candidate data and predictive insights take center stage.

The aesthetic follows a **Minimalist Corporate** movement with a "Dark Mode First" philosophy. It utilizes high-contrast typography against deep navy backgrounds to reduce eye strain during long-winded sourcing sessions. The style is characterized by surgical precision: thin strokes, ample negative space within data cells, and a strictly functional use of color to indicate status and priority.

## Colors

The palette is anchored in a deep, tiered navy spectrum to create a sense of infinite depth and professional stability. 

- **Primary Indigo (#6366f1):** Reserved for primary actions, focus states, and key data visualizations. It acts as the "signal" within the dark interface.
- **Surface Strategy:** The background uses a tiered approach. The base layer is `#0b0f1a`, while elevated containers and cards use `#111827` to create subtle separation without relying on heavy shadows.
- **Status Tints:** We employ a high-chroma Emerald for success/hired states and Amber for warnings/pending reviews. These are used sparingly to avoid visual noise.
- **Borders:** Instead of solid grays, we use low-opacity white (`rgba(255, 255, 255, 0.08)`) to create a "glass-etched" look that feels premium and lightweight.

## Typography

This design system exclusively uses **Inter** to leverage its exceptional legibility in data-heavy SaaS environments. 

- **Weight Hierarchy:** Headlines use SemiBold (600) for immediate scanning. Body text defaults to Regular (400) to maximize readability in long candidate bios.
- **Micro-Copy:** Label styles (label-sm) often utilize uppercase with slight letter spacing to differentiate metadata from user-generated content.
- **Data Density:** Line heights are kept tight but comfortable (approx 1.4x - 1.5x) to ensure maximum information density on dashboards without sacrificing clarity.

## Layout & Spacing

The layout philosophy is based on a **12-column fluid grid** for desktop, optimized for wide-screen enterprise monitors.

- **Spacing Scale:** A strict 4px base unit is used. Most components utilize 8px (2 units) or 16px (4 units) for internal padding.
- **Grid Behavior:** On desktop, use a 1440px max-width container with 32px side margins. For data tables, the layout expands to fill 100% of the viewport width to accommodate multiple columns.
- **Reflow:** On tablet/mobile, the 12-column grid collapses to 4 columns. Complex data tables should transition to a "card-stack" view or horizontal scroll with frozen primary columns.

## Elevation & Depth

This design system avoids traditional drop shadows to maintain a clean, high-fidelity look. Instead, depth is communicated through **Tonal Layering** and **Subtle Outlines**:

- **Layer 0 (Background):** `#0b0f1a` – The base canvas.
- **Layer 1 (Cards/Navigation):** `#111827` – Elevated surfaces with a 1px border of `rgba(255, 255, 255, 0.08)`.
- **Layer 2 (Modals/Popovers):** `#1f2937` – Slightly lighter navy to indicate temporary interaction layers, often accompanied by a backdrop blur (12px) on the layers beneath.
- **Focus States:** Highlighting is achieved via the Primary Indigo border or a subtle outer glow (0px 0px 0px 2px) rather than a soft shadow.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional, "engineered" feel that is more approachable than sharp corners but more serious than highly rounded "consumer" apps.

- **Components:** Standard buttons, input fields, and small cards use 4px (0.25rem) rounding.
- **Pills/Status:** Status indicators (e.g., "Interviewing," "Hired") use the `rounded-full` (pill) utility to distinguish them from interactive buttons.
- **Progress Bars:** Thin 4px tracks with fully rounded ends.

## Components

- **Buttons:** Primary buttons use a solid Indigo background with white text. Secondary buttons are "Ghost" style: transparent background with a 1px white-alpha border.
- **Input Fields:** Dark backgrounds (`#0b0f1a`) with a 1px border. On focus, the border transitions to Indigo. Labels are always positioned above the field in `label-md` Slate-400.
- **Chips/Pills:** Small, non-interactive tags used for skills or categories. They feature a low-opacity Indigo background (`rgba(99, 102, 241, 0.1)`) and Indigo text.
- **Data Tables:** The core of the system. Rows have a 1px bottom border. Hover states use a subtle background shift to `#1f2937`. 
- **Progress Bars:** Ultra-thin (4px) bars used for "Match Scores" or "Pipeline Completion." The track is a dark navy, and the fill is the Primary Indigo or Success Emerald.
- **Cards:** Used for candidate profiles. Minimalist design with no shadow, defined only by the `#111827` surface color and a subtle 1px border.