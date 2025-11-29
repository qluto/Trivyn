# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
swift build        # Build the project
swift run          # Run the app (appears in menu bar)
pkill -f Tria      # Kill running instance
```

## Architecture

Tria is a macOS menu bar app implementing the "Three Wins" productivity method. Users set 3 goals each for daily, weekly, and monthly timeframes.

### Key Components

- **TriaApp** (`App/TriaApp.swift`): Entry point using `@NSApplicationDelegateAdaptor` for AppKit integration
- **AppDelegate**: Initializes `StatusBarController` on launch
- **StatusBarController** (`Services/`): Manages `NSStatusItem` and popover
- **FloatingWindowController** (`Services/`): Manages borderless `NSPanel` for Stickies-like floating window
- **GoalStore** (`ViewModels/`): `@MainActor` singleton managing goal state with `@Published` properties
- **StorageService** (`Services/`): Persistence layer using `UserDefaults` (JSON encoded)

### UI Pattern

SwiftUI views hosted in AppKit containers:
- `NSPopover` contains `MenuBarPopoverView` for menu bar interactions
- `NSPanel` (borderless, floating) contains `FloatingWindowView` for always-visible goals
- Both receive `GoalStore.shared` via `@EnvironmentObject`

### Data Model

`Goal` struct with `GoalLevel` enum (.daily/.weekly/.monthly). Each level allows max 3 goals. Goals are filtered by `isInPeriod(for:)` based on current date.

## Language

Comments and UI text are in Japanese. Code identifiers are in English.
