
# UI Styling Guidelines: Typography & Line Work

## 1. Typography Directions

### Hierarchy through Scale
Don't just use one font size. Use a specific scale to distinguish between device types and levels of importance. Based on the "Radio Button" and "Billing" examples:
*   **Base/Smartphone (Small):** 16px — Used for secondary descriptions or labels.
*   **Laptop (Medium):** 18px — The standard size for primary content and body text.
*   **Desktop (Large):** 20px — Used for sub-headers and important card titles.
*   **4K/Extreme (XL):** 24px — Reserved for main headings and hero numbers (e.g., account balances).

### Weight & Contrast
*   **The "Big & Bold" Rule:** Use **Bold** weights (700+) for main category headers and primary values (like the "Billing Account" label). 
*   **De-emphasizing Info:** For secondary information (e.g., "Imagine some text here" or "Laptops"), use a **Muted Color** (`--text-muted`) rather than just a smaller font. This keeps the layout clean while clearly signaling what is less important.
*   **Contextual Labels:** When a label is inside a status tag (like the "PRO" tag), remove the border and use a **lighter background shade** with bold, uppercase text to make it "pop" without adding visual clutter.

---

## 2. Line & Border Directions

### Iconography Stroke Width
*   **The 2px Standard:** When using SVG icons (like Lucide), set the **Stroke Width to 2px**. This provides enough visual weight to match the "Depth" system without feeling too heavy or too fragile.
*   **Stroke Color:** Icons should typically match the text color or the primary brand color to maintain a cohesive look.

### The "Border-Free" Principle
The video suggests that as you master **Layering (Depth)**, you should rely less on borders:
*   **Remove Borders on Cards:** If you are using different background shades (e.g., a card that is `oklch(0.3 ...)` on a background of `oklch(0.2 ...)`), you do not need a border. The color difference creates the edge.
*   **Cleaning up Tables/Graphs:** Remove borders from secondary elements like tables or graphs. Instead, use a slightly different shade of the background color to define the area. This makes the UI feel "lighter" and more modern.

---

## 3. CSS Implementation (Typography & Lines)

```css
:root {
  /* Font Sizes */
  --font-sm: 16px;
  --font-md: 18px;
  --font-lg: 20px;
  --font-xl: 24px;

  /* Line/Stroke */
  --stroke-width: 2px;
  --border-radius-lg: 16px;
  --border-radius-sm: 8px;
}

/* Primary Header Styling */
h1, .header-important {
  font-size: var(--font-xl);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

/* Secondary/Muted Description */
.description-text {
  font-size: var(--font-sm);
  color: var(--text-muted);
  font-weight: 400;
}

/* Status Tag (The "PRO" style) */
.status-tag {
  background: var(--bg-light); /* Shade difference instead of border */
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
}

/* Icon Container */
.icon-svg {
  stroke-width: var(--stroke-width);
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
}
```

### Summary of Change:
1.  **Rearrange for Hierarchy:** Put the largest, boldest text at the top or center of a card.
2.  **Add Icons for Context:** Use a 2px stroke icon to complement labels (e.g., adding a "Shield" icon to a "Safe & Stable" option).
3.  **Space it Out:** When increasing font sizes, ensure you increase the **Padding** and **Gap** between elements so the text doesn't feel cramped.