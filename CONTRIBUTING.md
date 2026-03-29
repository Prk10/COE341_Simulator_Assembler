# Using This Project as Your Starting Point

We are a group of COE 341 students who built this simulator and are sharing it so others can fork it and build their own version on top of it. This guide will help you get oriented and get started quickly.

---

## Table of Contents

- [How to Fork](#how-to-fork)
- [Understanding the Codebase](#understanding-the-codebase)
- [What You Should and Should Not Modify](#what-you-should-and-should-not-modify)
- [Common Things Students Might Want to Add](#common-things-students-might-want-to-add)
- [Found a Bug?](#found-a-bug)
- [A Note on Academic Integrity](#a-note-on-academic-integrity)

---

## How to Fork

1. Click the **Fork** button at the top right of this GitHub page.
2. GitHub will create a copy of the repo under your own account.
3. Clone your fork to your machine:
   ```bash
   git clone https://github.com/YOUR-USERNAME/REPO-NAME.git
   cd REPO-NAME
   ```
4. Open `index.html` in a modern browser. There is no install step or build process. It runs entirely in the browser.
5. From here, work on your own fork. You are not expected to open a pull request back to this repo.

---

## Understanding the Codebase

There is no framework or build system here. Everything is plain HTML, CSS, and JavaScript, so you can just open a file in any text editor and start reading.

```
basic-computer-simulator/
├── index.html      # All the UI, panels, controls, and layout
├── styles.css      # Styling and animations
├── computer.js     # Core logic: registers, instruction cycle, micro-operations
├── ui.js           # Connects the UI to the computer logic
```

If you care about the architecture side, start with `computer.js`. That is where the fetch-decode-execute cycle, all instructions, and the assembler live. The code is commented and follows the micro-operations in Mano's textbook closely, so having Chapter 5 open next to it helps a lot.

If you care more about the interface, start with `ui.js` and `index.html`. The UI is just DOM manipulation, nothing fancy.

---

## What You Should and Should Not Modify

### Safe to modify or extend
- `ui.js` and `index.html` - change the layout, add panels, add new controls
- `styles.css` - restyle however you like
- Sample programs and assembly examples
- Profiler metrics and visualization features
- Assembler pseudo-instructions

### Modify carefully
- The instruction execution methods in `computer.js`. These implement exact micro-operations from the textbook, so if you change them, double check against Mano Chapter 5.
- The fetch-decode-execute timing (T0 through T6). This part is precise and bugs here are genuinely hard to track down.

### Read fully before touching
- The assembler's two-pass logic. It works correctly for all standard cases. If you need to extend it, read both passes from top to bottom before you change anything.

---

## Common Things Students Might Want to Add

| Feature | Where to start |
|---|---|
| I/O instructions (INP, OUT) | Add cases in the execute stage in `computer.js` |
| Interrupt handling visualization | `computer.js` already has IEN/R flip-flops, build the UI around them |
| Step-back / undo execution | Snapshot register state before each cycle |
| Breakpoints | Add a breakpoint list in `ui.js`, check against it in the run loop |
| Dark/light mode toggle | CSS variables in `styles.css` |
| Export execution trace to a file | Collect log entries and trigger a Blob download in `ui.js` |
| New assembly pseudo-instructions | Extend the pseudo-op handler in `computer.js` |

---

## Found a Bug?

If you find a bug in the base simulator (not in code you added yourself), open a GitHub Issue on this repo. Describe what instruction or program triggers it and what the wrong behavior is. It helps everyone else who forks this later.

---

## A Note on Academic Integrity

This project is here for you to learn from and build on, not to submit as-is. Your fork should reflect your own work. Using this as a starting point is totally fine, just make sure what you hand in is actually yours.
