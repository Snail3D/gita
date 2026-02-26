# Product Requirements Document: Gita Control Panel & Daemon

## Overview
Gita is a polished, Voicebox-inspired control panel backed by a powerful headless daemon. It serves as an API-first automation and job-running platform featuring a striking "ghost theme" UI with fluid smoke animations, seamless desktop app integration, and robust time-based scheduling capabilities.

## Key Features
1. **Headless Daemon Mode**: Runs quietly in the background as a system service, managing state, schedules, and API requests without requiring the UI to be open.
2. **Voicebox-like Control Panel**: A highly polished, aesthetic frontend interface designed for fast, intuitive control over active processes.
3. **Ghost Theme & Smoke Animations**: Dark, ethereal UI design with fluid, interactive smoke animations (WebGL/CSS) for a premium, magical feel.
4. **Desktop App Launcher**: System tray integration and quick-launch capabilities. The control panel can be instantly summoned or dismissed.
5. **API-First Design**: Every UI action is backed by a documented API endpoint, allowing external CLI, programmatic control, or web-based invocation.
6. **Cron & Time-Saved Jobs**: Built-in robust scheduling for executing recurring tasks and saved jobs precisely on time.
7. **Presets & Status**: Save job configurations as one-click presets. Real-time status monitoring of the daemon, active jobs, and past job history.

## Acceptance Criteria
- [ ] **Daemon Reliability**: System must be able to launch in a purely headless state, continually responding to API requests and executing cron jobs without a GUI.
- [ ] **API Completeness**: 100% of UI capabilities (start job, stop job, edit preset, get status) must be achievable via the REST/WebSocket API.
- [ ] **Aesthetics**: Frontend successfully implements the "Ghost Theme" and renders smooth, 60fps smoke animations without degrading system performance.
- [ ] **Desktop Integration**: App sits reliably in the system tray and can be launched/hidden seamlessly using a global hotkey or tray click.
- [ ] **Scheduling Accuracy**: Users can create, edit, and delete cron-based jobs. Jobs execute accurately at the scheduled time within a 1-second margin of error.
- [ ] **Presets**: Users can save complex configurations as presets and apply them instantly via the UI or API.
- [ ] **Status Monitoring**: UI accurately reflects the real-time status of the daemon and any running jobs via WebSockets, with zero need for manual refreshing.