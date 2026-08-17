// store.jsx
// Central state management for React blueprint — uses Context + useReducer.
// Moved to .jsx so Vite's JSX import analysis handles JSX in the file.

import React, { createContext, useContext, useReducer, useEffect } from 'react';

const KEY = 'mini_medium_react_v1';

const initialState = {
  draftBlocks: [],
  publishedArticles: [],
  filters: { search: '' }
};

function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).slice(2,9);
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload };
    case 'setFilter':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'addBlock': {
      const block = { id: genId(), type: action.payload.type, content: action.payload.content || '', url: action.payload.url || '', createdAt: Date.now() };
      return { ...state, draftBlocks: [block, ...state.draftBlocks] };
    }
    case 'updateBlock': {
      const { id, patch } = action.payload;
      return { ...state, draftBlocks: state.draftBlocks.map(b => b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b) };
    }
    case 'deleteBlock':
      return { ...state, draftBlocks: state.draftBlocks.filter(b => b.id !== action.payload.id) };
    case 'moveBlock': {
      const { id, direction } = action.payload;
      const arr = state.draftBlocks.slice();
      const idx = arr.findIndex(b => b.id === id);
      if (idx === -1) return state;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return state;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...state, draftBlocks: arr };
    }
    case 'publishArticle': {
      const title = (action.payload.title || '').trim();
      if (!title) throw new Error('Title required');
      if (!state.draftBlocks.length) throw new Error('No draft blocks');
      const article = { id: genId(), title, blocks: state.draftBlocks.map(b => ({ ...b })), createdAt: Date.now() };
      return { ...state, publishedArticles: [article, ...state.publishedArticles], draftBlocks: [] };
    }
    case 'publishArticleDirect': {
      // payload.article should be a fully-formed article object created by caller
      const a = action.payload.article;
      if (!a || !a.id) return state;
      return { ...state, publishedArticles: [a, ...state.publishedArticles], draftBlocks: [] };
    }
    case 'deleteArticle':
      return { ...state, publishedArticles: state.publishedArticles.filter(a => a.id !== action.payload.id) };
    case 'loadDraftFromArticle':
      return { ...state, draftBlocks: (action.payload.blocks || []).map(b => ({ ...b })) };
    case 'seedDemo':
      return { ...state, draftBlocks: action.payload };
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // hydrate on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: 'hydrate', payload: parsed });
      }
    } catch (err) { console.warn('hydrate failed', err); }
  }, []);

  // persist on state change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) { console.warn('persist failed', err); }
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
