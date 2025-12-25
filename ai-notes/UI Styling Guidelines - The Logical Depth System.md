Based on [The Easy Way to Pick UI Colors](https://www.youtube.com/watch?v=vvPklRN0Tco)
![[UI Color structure.png]]


![[UI Color notes - Codes.png]]

This UI Styling Guideline is based on the **Logical Color and Depth System** presented in the videos. It utilizes **OKLCH** for color definitions, which is the modern standard for Tailwind CSS v4 and beyond, providing better perceptual uniformity and accessibility.

---

# UI Styling Guidelines: The Logical Depth System

## 1. Styling Directions

### Depth & Layering (The "Flipping" Logic)
*   **The 3-Layer Rule:** Always define three levels of background depth. 
*   **Lightness Gradient:** Whether in Light or Dark mode, the base layer is the "darkest" in its context, and elements become "lighter" as they move closer to the user.
    *   **Bottom Layer (`bg-dark`):** The main page canvas.
    *   **Middle Layer (`bg`):** For primary content containers (cards, sidebars).
    *   **Top Layer (`bg-light`):** For interactive elements (buttons, inputs, active states).
*   **Light Logic:** Simulate a top-down light source.
    *   **Highlights:** Use a 1px `border-top` (the `--highlight` variable) on elevated elements.
    *   **Inset Shadows:** Use `inset` shadows for recessed elements like progress bar tracks or toggles.

### Typography & Hierarchy
*   **Contrast Control:** Never use 100% white on black or 100% black on white. Use a "Sharp Heading" at ~95% contrast and "Muted Text" at ~70% contrast to reduce eye strain.
*   **Font Scale:**
    *   **16px:** Muted descriptions/secondary labels.
    *   **18px:** Standard body content.
    *   **20px:** Sub-headers and card titles.
    *   **24px+:** Main hero headers and bold values.

### Shape & Line Work
*   **Rounded Corners:** Use "generous" curves (e.g., `12px` to `20px`) for cards to make the UI feel modern and soft.
*   **Iconography:** Use a **2px stroke width** for icons to match the visual weight of the "Depth" system.
*   **Spacing:** Increase padding as elements grow in importance. Hierarchy is established not just by size, but by the "breathability" of the element.

---

## 2. Color Palette (OKLCH)

The following values use the **OKLCH(Lightness Chroma Hue)** format. Hue `295` is used here as the base tint (a subtle purple/blue), but can be adjusted for your brand.

### Dark Theme (Default)
In Dark Mode, lightness values range from **0.1 to 0.3**.

```css
:root {
  /* Backgrounds: 0.05 (5%) increments for depth */
  --bg-dark:  oklch(0.12 0.015 295);  /* Page Base */
  --bg:       oklch(0.17 0.015 295);  /* Card Level */
  --bg-light: oklch(0.22 0.015 295);  /* Interactive/Top */

  /* Text */
  --text:       oklch(0.95 0.03 295); /* Sharp Header */
  --text-muted: oklch(0.70 0.03 295); /* Secondary Info */

  /* Borders & Highlights */
  --border:    oklch(0.35 0.03 295 / 0.2); 
  --highlight: oklch(0.60 0.05 295 / 0.1); /* Top edge light simulation */

  /* Dual Primary */
  --primary:       oklch(0.70 0.15 115); /* Vibrant Green/Brand */
  --primary-muted: oklch(0.35 0.08 115); /* Deeper/Muted Brand */

  /* Semantic Colors */
  --danger:  oklch(0.62 0.15 25);   /* Red */
  --warning: oklch(0.85 0.12 90);   /* Yellow/Gold */
  --success: oklch(0.72 0.15 145);  /* Green */
  --info:    oklch(0.70 0.12 250);  /* Blue/Purple */

  /* Shadows */
  --shadow: 0 4px 6px -1px oklch(0 0 0 / 0.3), 0 2px 4px -2px oklch(0 0 0 / 0.3);
}
```

### Light Theme
In Light Mode, lightness values range from **0.8 to 1.0**.

```css
[data-theme="light"] {
  /* Backgrounds: Incremental lightness for elevation */
  --bg-dark:  oklch(0.82 0.015 295); 
  --bg:       oklch(0.92 0.015 295); 
  --bg-light: oklch(1.00 0.000 295); 

  /* Text */
  --text:       oklch(0.15 0.03 295); 
  --text-muted: oklch(0.40 0.03 295); 

  /* Borders & Highlights */
  --border:    oklch(0.80 0.03 295 / 0.5); 
  --highlight: oklch(1.00 0.00 0 / 1); /* Pure white top highlight */

  /* Brand & Semantic (Adjusted for contrast on white) */
  --primary:       oklch(0.60 0.15 115);
  --primary-muted: oklch(0.90 0.05 115);
  
  --shadow: 0 10px 15px -3px oklch(0 0 0 / 0.05), 0 4px 6px -4px oklch(0 0 0 / 0.05);
}
```

---

## 3. Implementation & Integration

### CSS Adaptation (Media Query)
To automatically adapt to the user's OS preference, use the `prefers-color-scheme` media query to wrap the light theme variables.

```css
@media (prefers-color-scheme: light) {
  :root {
    /* Copy variables from Light Theme above */
    --bg-dark: oklch(0.82 0.015 295);
    /* ... etc */
  }
}
```

### Manual Theme Toggling (JavaScript)
For apps requiring a manual toggle button, use a data attribute on the `<html>` or `<body>` element.

**JavaScript:**
```javascript
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const targetTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', targetTheme);
  localStorage.setItem('theme', targetTheme); // Persistent choice
}
```

### Component Logic (CSS)
Apply variables to components to ensure they update automatically when the theme changes.

```css
body {
  background-color: var(--bg-dark);
  color: var(--text-muted);
}

.card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-top: 1px solid var(--highlight); /* Essential Light Logic */
  box-shadow: var(--shadow);
  border-radius: 16px;
}

.button-primary {
  background-color: var(--primary);
  color: oklch(0 0 0); /* Black text on vibrant green */
}
```