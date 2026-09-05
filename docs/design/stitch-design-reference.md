---
name: Technical Ink
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#ccc7af'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#95917c'
  outline-variant: '#4a4735'
  surface-tint: '#d6c942'
  primary: '#ffffff'
  on-primary: '#363100'
  primary-container: '#f3e65c'
  on-primary-container: '#6e6600'
  inverse-primary: '#686000'
  secondary: '#87db61'
  on-secondary: '#0f3900'
  secondary-container: '#297800'
  on-secondary-container: '#a7fe7f'
  tertiary: '#ffffff'
  on-tertiary: '#541b3d'
  tertiary-container: '#ffd8e9'
  on-tertiary-container: '#914e73'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f3e65c'
  primary-fixed-dim: '#d6c942'
  on-primary-fixed: '#1f1c00'
  on-primary-fixed-variant: '#4e4800'
  secondary-fixed: '#a2f87a'
  secondary-fixed-dim: '#87db61'
  on-secondary-fixed: '#062100'
  on-secondary-fixed-variant: '#195200'
  tertiary-fixed: '#ffd8e9'
  tertiary-fixed-dim: '#ffafd7'
  on-tertiary-fixed: '#3a0427'
  on-tertiary-fixed-variant: '#6f3154'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  ink-1000: '#06070a'
  ink-950: '#0a0c10'
  ink-900: '#10131a'
  ink-800: '#171b24'
  ink-700: '#202632'
  ink-500: '#3c4554'
  ink-300: '#8a93a3'
  ink-100: '#e4e8ee'
  hl-blue: '#80D8FF'
typography:
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.5'
  body-std:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.55'
  body-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  eyebrow:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0.16em
  code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  caption:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 24px
  margin-desktop: 48px
  container-max: 1280px
  section-gap: 96px
---

## Brand & Style

This design system is built on a "Technical Ink" aesthetic, merging high-precision developer tools with the organic, tactile feel of physical markup. It targets a technical audience that values both functional clarity and creative expression.

The design style is **Minimalist-Tactile**. It utilizes a deep, "Ink" base layer that feels like a void, brought to life by vibrant, high-contrast "Highlighter" accents. The system avoids traditional depth markers like shadows, opting instead for structural borders and "rough" SVG filters that simulate ink bleed and marker textures. The personality is professional and systematic, yet retains a human, "hand-drawn" quality through intentional imperfections like slight rotations and irregular corner radii on highlighted elements.

## Colors

The color system is optimized for a high-contrast dark mode environment. The foundation is **Ink-950**, providing a deep, non-pure-black background that reduces eye strain while maintaining punchy contrast.

### Palette Roles
- **Primary (Yellow):** The default highlight color for search matches and primary actions.
- **Secondary (Green):** Used for "additive" or positive status highlights.
- **Tertiary (Pink):** Used for "singular" or focused UI elements.
- **Specific (Blue):** Reserved for callouts and specific technical matches.
- **Neutrals:** **Ink-100** is the primary text color, while **Ink-700** is strictly reserved for hairline rules and structural divisions to maintain a crisp, blueprint-like clarity. 

All highlighter colors must be applied with an "isolation" or "multiply-like" effect when overlaying text to ensure the underlying `ink-1000` or `ink-950` remains legible.

## Typography

The typography strategy uses **JetBrains Mono** for all brand and technical identifiers to reinforce the developer-centric nature of the product. **Geist** handles all functional UI and long-form reading, providing a neutral, highly legible sans-serif balance.

- **Headlines:** Use JetBrains Mono with tight tracking to create a "blocky," structural feel.
- **Labels & Meta:** Use the Eyebrow style for section headers, emphasizing the technical "drafting" aesthetic with wide letter spacing.
- **Code:** JetBrains Mono is used exclusively for snippets and technical metadata to ensure character distinction (e.g., 0 vs O).

## Layout & Spacing

The layout is governed by a **12-column fluid grid** that prioritizes generous whitespace to evoke the feeling of a clean drafting board.

- **Rhythm:** A base 4px/8px unit controls all internal component spacing.
- **Grid:** Use a 24px gutter for all screen sizes. On desktop, the layout is capped at 1280px and centered.
- **Breakpoints:** At 960px, all multi-column spans collapse into a single-column (span 12) stack to maintain legibility on smaller devices.
- **Padding:** High-impact sections use a massive 96px vertical gap to ensure distinct mental separation between content blocks.

## Elevation & Depth

This system intentionally avoids shadows. Depth is communicated through **Tonal Layering** and **Hairline Outlines**:

1.  **Base Layer:** `ink-950` is the default page background.
2.  **Raised Surface:** Elevated containers (cards, modals) use `ink-900`.
3.  **Nested Surface:** Internal containers (icon backgrounds, small chips) use `ink-800`.
4.  **Borders:** All containers must be defined by a 1px solid border of `ink-700`.

To create a sense of "active" depth, use the highlighter colors. These elements should feel like they are sitting *on* the surface, achieved by applying a slight rotation (between -1.4deg and 0.6deg) to break the rigid grid.

## Shapes

The shape language is "Soft-Geometric." While the grid is rigid, the corners are softened to feel more approachable.

- **Cards:** Use a 14px (`rounded-lg`) radius.
- **Chips/Swatches:** Use a 10px (`rounded-md`) radius.
- **Highlighters:** These are the exception. They should use an **organic, irregular radius** (e.g., `5px 8px 4px 7px`) to mimic a quick marker stroke.
- **Icons:** Always utilize a rounded container with a radius calculated at 18% of the icon's total size.

## Components

### Buttons
Primary buttons use the highlighter palette. They should not have shadows but should use the "rough" SVG filter on hover. Text within primary buttons should be `ink-1000`. Secondary buttons are outlined using `ink-700` with `ink-100` text.

### Highlighters (Chips/Highlights)
Used for emphasis. These elements must have a subtle rotation (-1deg) and the "rough" filter applied to their edges. They should appear "behind" the text they emphasize.

### Cards
Cards use the `ink-900` surface with an `ink-700` border. Padding is generous (48px) to maintain the minimalist drafting aesthetic.

### Input Fields
Inputs are flat, using `ink-1000` for the field background and `ink-700` for the border. On focus, the border color shifts to `--hl-yellow`.

### Code Blocks
Code blocks use a slightly darker background than the base (`ink-1000`) to create a "recessed" feel. All code text must be JetBrains Mono. Use `ink-500` for comments and muted metadata.