Based on [The Easy Way to Fix Boring UIs](https://www.youtube.com/watch?v=wcZ6jSlZqDc)
# UI Styling Guidelines: The Depth System

This system focuses on transforming "average" or "boring" UI into professional, high-quality designs by utilizing **Depth, Layering, and Light Logic.**

## 1. Styling Directions

### Color & Layering
*   **The 3-4 Shade Rule:** Always define 3 to 4 shades of your primary background color. 
    *   **Bottom Layer:** The darkest shade (Dark Mode) or most muted shade (Light Mode).
    *   **Middle Layer:** Used for the main content containers (cards, sidebars).
    *   **Top Layer:** Used for interactive elements (buttons, inputs, dropdowns).
*   **Lightness Increments:** When layering elements on top of one another, increase the lightness value by **0.1** (using the OKLCH color space) to create a natural sense of elevation.
*   **Contrast Hierarchy:** De-emphasize less important elements (like tables or secondary graphs) by using shades closer to the background color. Remove borders on these elements to simplify the view.

### Shadows & Realism
*   **Multi-Layer Shadows:** Avoid single, flat shadows. Combine a light "glow" or "border" on the top edge with a soft dark shadow at the bottom.
*   **Inner Shadows (Inset):** Use inset shadows to create "sunken" effects for progress bars or toggles, making the inner bar appear elevated within a recessed track.
*   **Light Source Consistency:** Style your UI as if light is coming from the top. The top edge of a card should be lighter (highlight), and the bottom should be darker (shadow).

### Layout & Shape
*   **Rounded Corners:** Use generous border-radius values ("nice round curves") to soften the interface and make it feel more modern.
*   **Padding & Spacing:** Increase padding within cards to allow elements to "breathe" and establish a clear hierarchy.
*   **Interactive Feedback:** Apply larger shadows and slightly lighter background colors on `:hover` and `:active` states to simulate the element moving closer to the user.

---

## 2. CSS Implementation

### Dark Theme (Default)
In dark mode, elevation is achieved by making "higher" elements lighter.

```css
:root {
  /* OKLCH Color Palette (L C H) */
  --primary: oklch(0.3 0.17 100);
  --bg-dark: oklch(0.1 0 264);    /* Bottom Layer */
  --bg: oklch(0.2 0 264);         /* Middle Layer */
  --bg-light: oklch(0.3 0 264);   /* Top Layer / Interactive */

  /* Text Colors */
  --text: oklch(0.96 0 264);
  --text-muted: oklch(0.76 0 264);

  /* Elevation Shadows */
  /* Combine: Top Highlight (white/low opacity) + Bottom Dark Shadow */
  --shadow-s: inset 0 1px 2px #ffffff30, 
               0 1px 2px #00000030, 
               0 0px 0px #00000015;

  --shadow-m: inset 0 1px 2px #ffffff30, 
               0 2px 4px #00000030, 
               0 4px 8px #00000015;

  --shadow-l: inset 0 1px 2px #ffffff30, 
               0 4px 8px #00000030, 
               0 8px 16px #00000015;
}

/* Example usage for a Search Input */
.search-input {
  background: var(--bg-light);
  box-shadow: var(--shadow-s);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}
```

### Light Theme
In light mode, elevation is often achieved through subtle shadows and slightly different shades of gray/white.

```css
body.light {
  /* OKLCH Color Palette */
  --primary: oklch(0.65 0.15 264);
  --bg-dark: oklch(0.92 0 264);    /* Page Background */
  --bg: oklch(0.96 0 264);         /* Card Background */
  --bg-light: oklch(1 0 264);      /* Active/Elevated Element */

  /* Text Colors */
  --text: oklch(0.15 0 264);
  --text-muted: oklch(0.4 0 264);

  /* Adjusted Shadows for Light Mode */
  --shadow-s: inset 0 1px 2px #ffffff, 
               0 1px 3px #00000010;
               
  --shadow-m: inset 0 1px 2px #ffffff, 
               0 4px 6px #00000008;
}

/* Example usage for a Profile Card */
.profile-card {
  background: var(--bg);
  box-shadow: var(--shadow-m);
  border-radius: 20px;
  padding: 1.5rem;
}

.profile-card:hover {
  background: var(--bg-light);
  box-shadow: var(--shadow-l);
}
```

### Advanced: Inset Progress Bars
To create the "recessed" look shown in the billing and fine-tune sections:

```css
.progress-track {
  background: var(--bg-dark);
  /* Dark inset top, Light inset bottom */
  box-shadow: inset 0 2px 4px #00000020, 
              inset 0 -1px 2px #ffffff10;
  border-radius: 50px;
  height: 12px;
}

.progress-bar {
  background: var(--primary);
  /* Elevation highlight on the moving part */
  box-shadow: 0 1px 2px #00000030;
  border-radius: 50px;
}
```

---
**Design Secret:** Taking a design from "Average" to "Good" takes significantly less effort than moving from "Good" to "Perfect." Focus on these **low-effort/high-reward** depth techniques to maximize your UI quality.