<p align="center">
  <img src="public/logo.png" alt="Marksmith logo" width="120" />
</p>

# Marksmith

A client-side web app for building, organizing, and exporting browser bookmarks.

## Features

- **Folder & bookmark management** — Create nested folder hierarchies, edit titles/URLs, reorder via drag-and-drop, and delete items
- **Bulk add** — Paste multiple URLs (one per line, optionally with titles) to add bookmarks quickly
- **Favicon fetching** — Automatically fetches site icons with a concurrent queue and multiple fallback sources
- **Import** — Load existing bookmarks from Netscape/HTML files with options to replace, merge alongside, or merge into a selected folder
- **Export** — Generate Netscape Bookmarks HTML that preserves icons, timestamps, and toolbar flags
- **Search** — Global search by title and URL with keyboard-navigable results
- **Undo/Redo** — Full state history (up to 50 snapshots) via `Ctrl+Z` / `Ctrl+Shift+Z`
- **Responsive layout** — Resizable sidebar, mobile tab switcher, breadcrumb navigation
- **Live stats** — Folder and bookmark counts displayed in the header

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Svelte 5](https://svelte.dev) (Runes API) |
| Build | [Vite 6](https://vite.dev) |
| Language | TypeScript 5 (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Drag & Drop | [svelte-dnd-action](https://github.com/isaacHagworthy/svelte-dnd-action) |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+F` or `/` | Focus search |
| `Escape` | Close modal / clear search |

