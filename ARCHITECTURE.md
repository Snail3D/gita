# Architecture Overview

## Core Philosophy: API-First
Gita is designed with a strict decoupling between the background daemon and the user interface. The UI is simply a client consuming the daemon's API. This ensures the core engine can run headless on a server, while the desktop app provides a magical, Voicebox-like control layer.

## System Components

### 1. Headless Daemon (Backend)
- **Runtime**: Node.js / TypeScript (or Go/Rust if high-performance threading is needed for heavy I/O, but Node.js is preferred for web-ecosystem integration).
- **API Layer**: Express / Fastify (REST & WebSockets for real-time status and logs).
- **Scheduler**: `node-cron` or `bree` for managing time-saved jobs with high reliability.
- **Data Store**: SQLite (via Prisma, Drizzle, or Kysely) for persisting jobs, presets, logs, and daemon state.
- **Process Manager**: Capable of running entirely detached from the GUI, daemonizing itself via PM2, systemd, or native OS launch agents.

### 2. Desktop App Launcher & UI (Frontend)
- **Framework**: Electron (or Tauri) + React / Next.js.
- **System Integration**: Electron Tray API and global shortcuts for background minimization, quick-launch, and headless lifecycle management.
- **Theme Engine**: TailwindCSS configured for the "Ghost Theme" (dark, translucent, ethereal elements, glassmorphism).
- **Animation Engine**: Three.js / WebGL or framer-motion for high-performance fluid smoke animations that react to user input and daemon status (e.g., intense smoke when a job is running).
- **State Management**: Zustand or React Query for syncing daemon status via API/WebSockets, ensuring UI state matches daemon truth without complex prop drilling.

## Data Flow
1. **User Action**: User selects a saved preset in the React UI (e.g., "Run Nightly Backup").
2. **API Request**: UI sends a POST request to the Daemon's local API endpoint.
3. **Processing**: Daemon validates the request, updates the SQLite database, and initiates the job as a child process or internal routine.
4. **Real-time Feedback**: Daemon broadcasts a status update (e.g., `status: running`, `progress: 10%`) via WebSockets to all connected clients.
5. **UI Update**: The Electron app receives the WebSocket event and updates the visual status indicators and smoke animations seamlessly.