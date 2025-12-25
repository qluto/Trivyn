# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install           # Install dependencies
npm run tauri:dev     # Run dev server (hot reload)
npm run tauri:build   # Build production app
pkill -f tria         # Kill running instance
```

## Architecture

Tria is a **multiplatform desktop app** (macOS, Windows, Linux) built with **Tauri 2.x** implementing the "Three Wins" productivity method. Users set 3 goals each for daily, weekly, and monthly timeframes.

### Tech Stack

- **Backend**: Rust + Tauri 2.9 + SQLite (rusqlite)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite with rusqlite
- **Styling**: Tailwind CSS with custom dark theme

### Key Components

#### Backend (Rust)

- **main.rs** (`src-tauri/src/main.rs`): Entry point, initializes database, tray, and windows
- **Database Layer** (`src-tauri/src/db/`): SQLite schema, migrations, and CRUD operations
- **Tauri Commands** (`src-tauri/src/commands/`): Backend API exposed to frontend
  - `goals.rs`: Goal CRUD operations
  - `settings.rs`: Settings management
- **System Tray** (`src-tauri/src/tray/mod.rs`): Tray icon with menu and click handlers
- **Window Management** (`src-tauri/src/window/mod.rs`): Floating window and popup window setup

#### Frontend (React/TypeScript)

- **FloatingWindow** (`src/components/floating/`): Always-visible draggable window
  - `FloatingWindow.tsx`: Main container with level switcher
  - `LevelSwitcher.tsx`: Tab switching (今日/今週/今月)
  - `NumberedGoalRow.tsx`: Individual goal display (1, 2, 3)
  - `AddGoalField.tsx`: Inline goal addition
  - `EmptyState.tsx`: Empty state message

- **MenuBarPopover** (`src/components/popover/`): Popup window from tray icon
  - `MenuBarPopover.tsx`: Main container with Tria branding and bottom navigation
  - `HistoryView.tsx`: Goal history grouped by level
  - `ReflectionView.tsx`: Reflection input with 3 prompts
  - `SettingsView.tsx`: App settings (week start, language, notifications)

- **State Management** (`src/store/`):
  - `goalStore.ts`: Zustand store managing goals state and Tauri command calls
  - `settingsStore.ts`: App settings state

### UI Pattern

React components in Tauri windows:
- **Floating Window** (`label: "main"`): Transparent, borderless, always-on-top window showing current goals
- **Popup Window** (`label: "popover"`): Appears on tray icon click, shows detailed views with bottom navigation
- Both windows use `data-tauri-drag-region` for draggable areas
- Glass morphism design with `backdrop-blur` and dark theme

### Data Model

#### Database (SQLite)

**goals table**:
- `id`: UUID primary key
- `title`: Goal text
- `level`: 'daily' | 'weekly' | 'monthly'
- `is_completed`: Boolean (0/1)
- `completed_at`: Unix timestamp (ms)
- `created_at`: Unix timestamp (ms)
- `period_start`: Period start timestamp
- `parent_goal_id`: Optional parent goal reference
- `note`: Optional notes

**settings table**:
- `key`: Setting name (primary key)
- `value`: Setting value (JSON string)

**reflections table**:
- `id`: Auto-increment
- `level`: Goal level
- `period_key`: Period identifier (e.g., "2025-W52")
- `insight_1`, `insight_2`, `insight_3`: Reflection text
- `created_at`: Unix timestamp

#### TypeScript Types

`Goal` interface matching Rust model. `GoalLevel` type: 'daily' | 'weekly' | 'monthly'. Max 3 goals per level.

## Language

Comments and UI text are in Japanese. Code identifiers are in English.

## Documentation

When adding, removing, or modifying features, always update `FEATURES.md` to keep it in sync with the codebase.
