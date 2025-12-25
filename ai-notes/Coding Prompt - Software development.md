### Summary Checklist for Vibe Coding
To avoid "AI Slop," always prompt with this loop:
1.  **Context:** "Read these files..."
2.  **Plan:** "Tell me where you will make changes globally..."
3.  **Execute:** "Write the modular code..."
4.  **Review:** "Check for hardcoded values and unused imports."

---
### 1. Context Myopia (Tunnel Vision)
AI tends to fix the specific line you asked about while ignoring the broader architecture.
*   **The Mistake:** Applying a local CSS fix (`style="color: red"`) instead of updating the global theme, or patching a single function while ignoring the interface definition.
*   **Prevention:** explicitly instruct the AI to **"Think globally, act locally."** Ask it to analyze the project structure (or share the file tree) before generating code.
    *   *Prompt:* "Review `theme.css` and apply this color change there, then reference it here."

### 2. The God-Object Trap
Because AI creates output sequentially, it prefers dumping everything into one massive file rather than creating a clean file structure.
*   **The Mistake:** Creating a single `App.js` or `main.py` containing UI logic, database connections, and helper functions.
*   **Prevention:** Enforce **Modularization**. Ask the AI to plan the file structure first.
    *   *Prompt:* "Split this solution into three files: logic, UI, and utilities. Do not put everything in one file."

### 3. Cargo Cult & Zombie Code
AI often includes imports, variables, or patterns it saw in its training data that are irrelevant to your specific context.
*   **The Mistake:** Importing libraries that are never used (**Dead Code**), or using a complex design pattern (like a Factory) for a simple task (**Over-engineering**).
*   **Prevention:** Use a Linter or specifically ask for cleanup.
    *   *Prompt:* "Review the code for unused imports or variables and remove them. Keep the solution as simple as possible (KISS principle)."

### 4. Hardcoding & Magic Numbers
AI lacks the concept of "future deployment." It writes code meant to run *now*, not code meant to be configured later.
*   **The Mistake:** Placing API keys, specific file paths, or unexplained integers (e.g., `timeout = 300`) directly in the logic.
*   **Prevention:** Demand **Configuration Extraction**.
    *   *Prompt:* "Do not hardcode values. Extract all constants and API keys into a generic configuration dictionary or `.env` file references."

### 5. The Zebra Pattern (Inconsistent Style)
AI forgets previous instructions or context from earlier in the chat, leading to mixed coding styles.
*   **The Mistake:** Using `snake_case` in one function and `camelCase` in another, or mixing `async/await` with `.then()` syntax.
*   **Prevention:** Provide a **Style Primer**.
    *   *Prompt:* "Adopt the coding style found in `utils.js` for all new code. Use TypeScript interfaces and Arrow functions exclusively."

### 6. Refuctoring (Regressive Fixes)
When asked to change one feature, AI often rewrites perfectly good adjacent code, accidentally breaking it or re-introducing bugs.
*   **The Mistake:** **Shotgun Surgery** where the AI rewrites an entire file just to change one variable, inadvertently dropping a previous fix.
*   **Prevention:** Request **Differential Changes** or "surgical updates."
    *   *Prompt:* "Only show me the specific function that needs changing. Do not output the rest of the file. Ensure no existing functionality is removed."
