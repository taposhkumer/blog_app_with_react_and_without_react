Medium Publisher (React) — Blueprint

This folder contains a React-based blueprint of the Mini Medium block editor. It mirrors the vanilla implementation but uses React, Context + useReducer for state, and standard component props/callbacks for communication.

How to run:
1. cd medium-publisher-react
2. npm install
3. npm run dev

Notes:
- The project is intentionally minimal and unopinionated (Vite). It persists to localStorage just like the vanilla version.
- The design intentionally keeps state-first semantics: components call dispatch actions, which mutate the central store; UI re-renders from state snapshots.

Files of interest:
- src/store.js: React context + reducer that persists state
- src/App.jsx: main UI wiring
- src/components/*: BlogBlock, MediaUploader, StatBadge, ArticleCard

If you want, I can:
- Add drag-and-drop reordering using react-beautiful-dnd (requires adding dependency)
- Add richer inline formatting for paragraph blocks
- Scaffold tests with Jest/React Testing Library
