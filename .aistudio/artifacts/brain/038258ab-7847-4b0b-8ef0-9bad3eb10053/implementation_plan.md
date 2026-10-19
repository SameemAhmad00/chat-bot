# Accessibility & Readability Overhaul for Persona AI Companion

An accessibility and readability enhancement for Persona AI Companion that introduces theme switching (High-Contrast Dark & Light modes), responsive font scaling controls, $\ge 44\text{px}$ touch targets, visible focus indicators, and WCAG AA contrast compliance across all screens.

## Confirmed Clarifications & Decisions

> [!IMPORTANT]
> - **Theme & Contrast**: Added high-contrast theme support with an accessible **Light / Dark / High-Contrast** mode toggle.
> - **Readability & Sizing**: User-configurable **Font Size Controls** (Normal, Large, Extra Large) that dynamically scale typography across chat bubbles, navigation, and dashboards.
> - **Touch Targets & Focus**: All interactive buttons, inputs, tabs, and file tree nodes upgraded to $\ge 44\text{px}$ touch targets with visible focus rings (`focus-visible:ring-2`).

---

## 1. Overview & Core Concept

While Persona AI Companion previously featured an intimate dark sanctuary theme, users with visual impairments, light-sensitivity, or mobile touch accessibility needs require stronger contrast ratios, clear text sizing, and daylight readability. This upgrade implements:
1. **Light & Dark Theme Engine**: A high-contrast daylight mode (`#F8FAFC` canvas, crisp `#0F172A` text, vibrant rose accents) alongside the warm obsidian dark mode.
2. **Font Scale Selector**: An instant `A-` / `A+` font size control in the navigation bar that dynamically adjusts the root and component typography scale (100%, 115%, 130%).
3. **Ergonomic Touch Targets**: Expanded clickable areas ($\ge 44\text{px}$) for voice buttons, send triggers, audio toggles, and memory action buttons.
4. **Enhanced Keyboard & Screen Legibility**: Crisp `focus-visible` rings for keyboard navigation and uncompressed line heights for easy reading.

---

## 2. User Experience & Visual Design

### Theme Palettes

| Token | Dark Mode (Default) | High-Contrast Light Mode |
|---|---|---|
| **Canvas Background** | `#0E0D10` (Obsidian) | `#F8FAFC` (Crisp Slate White) |
| **Surface Containers** | `#161419` / `#1C1920` | `#FFFFFF` (Pure White Card) |
| **Borders & Dividers** | `rgba(255, 255, 255, 0.12)` | `#CBD5E1` (Solid Slate 300) |
| **Primary Text** | `#FFFFFF` (High Legibility) | `#0F172A` (Deep Slate Black) |
| **Secondary / Muted Text**| `#CBD5E1` (WCAG AA 5.5:1) | `#475569` (Slate 600, 7.2:1) |
| **Accent / Focus** | `#FB7185` (Luminous Rose) | `#E11D48` (Vibrant Crimson) |

### Accessibility Controls in Top Bar

- **Theme Toggle**: Switch between **Dark**, **Light**, and **High Contrast** with 1 click.
- **Font Size Switcher**: Segmented `A` (Normal 15px), `A+` (Large 17px), and `A++` (Extra Large 19px) control.
- **Touch Target Padding**: Increased button padding to `min-h-[44px]` and `min-w-[44px]` for all interactive controls (Send button, Mic button, TTS playback, tab links).

---

## 3. Technical Implementation Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Accessibility State Store                       │
│                                                                        │
│   theme: 'dark' | 'light' | 'high-contrast'                            │
│   fontSize: 'normal' | 'large' | 'xlarge'                              │
│   (Persisted to localStorage & synced with document root class)        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌──────────────────────────────────┐   ┌────────────────────────────────┐
│      Theme Class Propagation     │   │      Dynamic CSS Variables     │
│   - documentElement.classList    │   │   --app-font-scale: 1.0 / 1.15 │
│   - Tailwind dark / light vars   │   │   --touch-target-min: 44px     │
└──────────────────────────────────┘   └────────────────────────────────┘
```

1. **State & Local Storage**:
   - Create `useAccessibility` hook or store managing `theme` and `fontSizeScale`.
   - Apply `.dark` or `.light` class to `<html>` and update CSS variables for base font scaling.
2. **Component Upgrades**:
   - **Navbar**: Add Accessible Controls cluster (Theme Toggle + Font Size Switcher) cleanly within Zone 3.
   - **ChatView**: High-contrast user and companion message bubbles, increased font sizes, enhanced contrast on timestamps and memory tags, $\ge 44\text{px}$ touch targets on input bar, mic, and send buttons.
   - **UploadView**: Clearer border definitions, prominent drop zones, high contrast file status chips.
   - **BrainView**: High contrast sliders with visible numeric readout badges and clear keyboard focus outlines.
   - **FilesView**: Distinct folder tree row highlights, high contrast file preview preformatted code blocks.
3. **Verification**:
   - Validate WCAG AA contrast standards ($\ge 4.5:1$ text contrast).
   - Ensure clean compilation with `compile_applet`.
