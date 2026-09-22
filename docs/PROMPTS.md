# COPILOT PROMPTS

## Context Block

Use this context before asking Copilot for technical help:

> I am building a browser-based creative coding system using HTML, CSS,
> JavaScript, and Canvas.
>
> My project separates responsibilities into:
>
> - index.html — page structure
> - style.css — visual styling
> - main.js — entry point that connects systems
> - src/canvas/ — Canvas setup and animation loop
> - src/input/ — user input
> - src/utils/ — reusable math and helper functions
>
> My creative intent and constraints are defined in
> docs/SYSTEM_CHARTER.md.
>
> Do not invent new creative direction for me.
> Give technical implementation help that follows the existing intent.

---

# PROMPT 1 — CANVAS DRAW LOOP

> Using the existing project structure, help me implement a Canvas animation
> loop for this behavior:
>
> [DESCRIBE THE BEHAVIOR]
>
> Keep the implementation inside the existing src/canvas files where
> appropriate.
>
> Do not add libraries.
> Do not redesign the visual concept.
> Explain which file each change belongs in and why.

---

# PROMPT 2 — INPUT MAPPING

> I need to connect this input:
>
> [DESCRIBE INPUT]
>
> to this parameter:
>
> [DESCRIBE PARAMETER]
>
> The desired behavior is:
>
> [DESCRIBE BEHAVIOR]
>
> Use the existing input system and keep the creative decision unchanged.
> Explain the math or mapping in plain language after providing the solution.

---

# PROMPT 3 — DEBUGGING

> My system is supposed to do this:
>
> [DESCRIBE EXPECTED BEHAVIOR]
>
> Instead, it currently does this:
>
> [DESCRIBE ACTUAL BEHAVIOR]
>
> Here is the relevant error or code:
>
> [PASTE ERROR OR CODE]
>
> Identify the most likely cause first.
> Make the smallest necessary fix.
> Do not restructure unrelated files.
> Explain what caused the problem and why the fix works.

---

# AI PROCESS RULE

Every AI response must be followed by my own explanation of:

1. What changed.
2. Which file changed.
3. Why the change was necessary.
4. How the change supports the intended system.

AI can help implement technical solutions, but it does not decide the
creative intent of the project.