---
name: Obsidian Precision
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#bdc2ff'
  on-secondary: '#131e8c'
  secondary-container: '#2f3aa3'
  on-secondary-container: '#a8afff'
  tertiary: '#4ee6aa'
  on-tertiary: '#003825'
  tertiary-container: '#22c990'
  on-tertiary-container: '#004e35'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#2f3aa3'
  tertiary-fixed: '#68fcbf'
  tertiary-fixed-dim: '#45dfa4'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.015em
  body-default:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-strong:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-muted:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  meta-numeric:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style
The design system embodies an ultra-focused, high-performance developer workspace. It targets software engineers, infrastructure architects, and technical operators who prioritize dense information clarity, zero-latency workflows, and typographic precision over visual decoration.

### Emotional Resonance & Aesthetic Posture
- **Utilitarian Discipline:** Every pixel communicates structure or data state. No ornamental gradients, skeuomorphic noise, or ambient decorative blobs.
- **Architectural Calm:** A deep, near-black canvas layered with balanced zinc surfaces creates a quiet, distraction-free environment for sustained deep work.
- **Micro-Precision:** Spatial awareness is established through surgical 1px borders, subtle surface offsets, and mono-spaced tabular precision.

## Colors
The palette is built around absolute depth, high-legibility foregrounds, and controlled single-wavelength semantic accents.

### Color Rules & Mapping
- **Base Canvas (`#090a0f`):** Used for global viewport background and outer root surfaces.
- **Surface Layer 1 (`#12151d`):** Primary container, sidebar, and elevated card fill.
- **Surface Layer 2 (`#1a1f2c`):** Active item states, inputs, dropdown menus, and hover highlights.
- **Structural Border (`#232733`):** Rigid 1px separator for panels, tables, and component perimeters.
- **Border Focus / Sub-active (`#343b4d`):** Hovered controls and inactive selections.
- **Primary Accent (`#38bdf8`):** Sky cyan reserved strictly for active interactive states, primary executions, and critical focal data.
- **Secondary Accent (`#818cf8`):** Subtle indigo reserved for secondary metadata, system functions, and non-blocking status cues.
- **Tertiary Accent (`#34d399`):** Pure emerald tone for success metrics, branch merges, and live operational signals.
- **Text & Foreground:**
  - High Contrast / Primary: `#f8fafc`
  - Secondary / Supporting: `#94a3b8`
  - Muted / Metadata: `#64748b`

## Typography
Typographic discipline is rooted in neutral geometric rhythm paired with strict monospaced data alignment.

### Application Rules
- **Geist:** Handles structure, body documentation, prose, and action labels. It remains condensed and neutral, avoiding display exaggeration.
- **JetBrains Mono:** Handles code snippets, git hashes, system timestamps, latency stats, command keys, and table metrics.
- **Tracking:** Tighter tracking (`-0.01em` to `-0.03em`) on headings preserves dense structural hierarchy; positive letter-spacing (`0.04em`) applies exclusively to all-caps micro metadata.

## Layout & Spacing
Layouts use a fluid, structural grid system governed by explicit division lines and dense spacing scales.

### Spatial Engine
- **Base Multiplier:** Built on a tight 4px baseline (`0.25rem`) to facilitate ergonomic density for developer interfaces.
- **Layout Model:** Fluid pane architecture. Main views collapse into single, stacked full-width rails on mobile, expand to multi-column split views (Navigation / Directory / Editor / Inspector) on desktop.
- **Breakpoints:**
  - `Mobile` (< 768px): Margin `1rem`, single column, collapsable drawer sheets.
  - `Tablet` (768px - 1024px): Margin `1.5rem`, fluid workspace, collapsible secondary sidebar.
  - `Desktop` (> 1024px): Margin `2rem`, persistent structural multi-pane layout with fixed navigation and resizable code/table containers.

## Elevation & Depth
This system eliminates ambient drop shadows and blur gimmicks in favor of architectural layer offsets and crisp physical boundary lines.

### Depth Mechanics
- **Zero-Shadow Default:** Elevation is established strictly through tonal step-ups: `#090a0f` (Canvas) → `#12151d` (Panels/Cards) → `#1a1f2c` (Overlays/Popovers).
- **Hairline Outlines:** All elevated panels rely on a precise `1px solid #232733` border. Hover states shift the border to `#343b4d`, never a glowing shadow.
- **Floating Controls (Menus & Command Palettes):** Overlays use background color `#12151d` with an outline of `1px solid #343b4d` and a microscopic, un-tinted keyline shadow (`0 4px 12px rgba(0, 0, 0, 0.6)`) strictly to separate overlapping text layers.

## Shapes
A controlled, compact radius scale maintains an engineered and surgical hardware-tool feel.

### Geometric Rules
- **Base Components (`0.25rem` / `4px`):** Used on buttons, form controls, inputs, badges, and code callouts.
- **Containers & Panels (`0.5rem` / `8px`):** Used on modal sheets, outer cards, terminal windows, and multi-line editor boxes.
- **Prohibited:** Circular pills, massive radii, or irregular organic shapes. Roundedness must remain subtle and industrial.

## Components

### Buttons
- **Primary:** Background `#38bdf8`, color `#090a0f`, font weight `500`. Hover shifts to `#7dd3fc`. No shadow.
- **Secondary:** Background `#12151d`, border `1px solid #232733`, color `#f8fafc`. Hover shifts border to `#343b4d` and surface to `#1a1f2c`.
- **Ghost / Minimal:** Background transparent, color `#94a3b8`. Hover color `#f8fafc`, background `#1a1f2c`.
- **Keyboard Accelerator:** Primary and secondary buttons reserve an inline mono badge on the far right showing `⌘K`, `↵`, etc., using font `JetBrains Mono` at `11px`.

### Inputs & Selectors
- **Container:** Height `32px` (compact) or `36px` (standard). Background `#090a0f`, border `1px solid #232733`. Radius `4px`.
- **Text:** Font `Geist` `13px`, text color `#f8fafc`. Placeholder `#64748b`.
- **Focus State:** Border shifts directly to `#38bdf8`. Zero focus ring glow or offset spread.
- **Prefix / Suffix:** Icons or currency/path indicators sit inside the perimeter rendered at `#64748b` with tabular mono spacing.

### Data Cards & Panels
- **Structure:** Background `#12151d`, border `1px solid #232733`, padding `space-lg`.
- **Header:** Clean single-line layout, title in `headline-sm`, actions or branch selectors right-aligned.
- **Dividers:** Horizontal lines inside cards use `1px solid #232733` with zero padding gap.

### Chips & Status Indicators
- **Minimal Status:** Instead of heavy rounded badges, status consists of a `6px` solid geometric square or dot next to a `12px` tabular mono label.
  - Active: `#38bdf8`
  - Success: `#34d399`
  - Inactive / Idle: `#64748b`
- **Filter Chips:** Background `#12151d`, border `1px solid #232733`, font `12px`, padding `2px 8px`. Active state introduces a border of `#38bdf8` with text `#f8fafc`.

### Checkboxes & Toggle Controls
- **Checkbox:** `14px` by `14px` square, border `1px solid #343b4d`, radius `2px`, background `#090a0f`. Checked state fills `#38bdf8` with a dark `#090a0f` checkmark icon.
- **Toggle Switch:** Rectangular track `28px` by `16px`, background `#1a1f2c`, border `1px solid #232733`. Thumb is an unrounded square or slightly softened `12px` block moving horizontally.

### Data Tables & Lists
- **Header Row:** Background `#090a0f`, border-bottom `1px solid #232733`, typography `label-sm` (`JetBrains Mono`, all-caps, text `#64748b`).
- **Body Rows:** Border-bottom `1px solid #1a1f2c`, hover background `#12151d`. Height `36px` density.
- **Numeric & Metric Cells:** Always styled with `meta-numeric` font token and aligned to the right.