# Task Breakdown & Milestones

This project is structured into three primary milestones, intended to be executed sequentially by three distinct builder agents to ensure focus and quality.

## Milestone 1: Foundation & Daemon (Builder 1)
**Focus:** API-first backend, headless execution mode, database, and scheduling.
- [ ] Initialize repository and monorepo structure (e.g., `packages/daemon`, `packages/desktop`).
- [ ] Implement headless Node.js daemon capable of running detached.
- [ ] Build REST & WebSocket API architecture.
- [ ] Integrate SQLite database (Prisma/Drizzle) for state management (presets, logs).
- [ ] Implement cron job scheduler and reliable job execution engine.
- [ ] Build API endpoints for Presets (CRUD) and Status querying (real-time).
- [ ] Document all API endpoints to unblock Builder 2.

## Milestone 2: Desktop App & UI Core (Builder 2)
**Focus:** Electron/Tauri wrapper, desktop system integration, and functional UI skeleton.
- [ ] Initialize Electron/React (or Tauri) frontend application.
- [ ] Implement Desktop App Launcher (System tray icon, window toggle, background run mode).
- [ ] Connect Frontend to Daemon API (REST + WebSocket subscriptions for status).
- [ ] Build functional views and routing: Dashboard, Presets manager, Cron jobs list.
- [ ] Ensure the UI can detect if the daemon is running, start it if not, and handle errors gracefully.
- [ ] Implement basic state management (Zustand) to sync UI with daemon reality.

## Milestone 3: Polish, Animations & "Ghost" Aesthetics (Builder 3)
**Focus:** Visuals, smooth smoke animations, theming, and final acceptance testing.
- [ ] Design and implement the "Ghost Theme" styling (dark mode, colors, typography, translucency, glassmorphism).
- [ ] Integrate high-performance WebGL/CSS smoke animations (using Three.js, React-Three-Fiber, or specialized CSS).
- [ ] Refine the Voicebox-like control panel layout for maximum aesthetic appeal, premium feel, and flawless UX.
- [ ] Polish UI transitions, hover states, loading indicators, and error feedback.
- [ ] Perform end-to-end acceptance testing against the criteria defined in the PRD (reliability, scheduling accuracy, UI performance).
- [ ] Finalize production build scripts and installer packages (DMG, AppImage, EXE).