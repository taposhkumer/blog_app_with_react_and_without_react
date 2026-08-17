// store.js
// Central Store for all app state. Single source of truth.
// - Encapsulates state
// - Persists to localStorage after mutations
// - Notifies subscribers (observer pattern) on every change
//
// Key rules implemented:
// 1) All user actions must go through Store methods (addBlock, updateBlock, deleteBlock, moveBlock, publishArticle, deleteArticle).
// 2) Store mutates memory state, persists it, then emits the fresh snapshot to subscribers.
// 3) UI (app.js) subscribes and re-renders DOM from the snapshot; UI never mutates the store directly.

const KEY = 'mini_medium_v1';

function genId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).slice(2,9);
}

const defaultState = {
  draftBlocks: [], // blocks: { id, type: 'paragraph'|'image'|'video', content: '', url: '', meta:{} }
  publishedArticles: [], // { id, title, blocks: [...], createdAt }
  filters: { search: '' }
};

class Store {
  constructor() {
    this._subs = new Set();
    this._state = JSON.parse(JSON.stringify(defaultState));
    this._hydrate();
  }

  _hydrate() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // basic sanitization
        this._state = {
          draftBlocks: Array.isArray(parsed.draftBlocks) ? parsed.draftBlocks : [],
          publishedArticles: Array.isArray(parsed.publishedArticles) ? parsed.publishedArticles : [],
          filters: parsed.filters || { search: '' }
        };
      }
    } catch (err) {
      console.warn('Failed to parse persisted state', err);
    }
  }

  _persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this._state));
    } catch (err) {
      console.warn('Failed to persist state', err);
    }
  }

  _emit() {
    // emit a deep-ish clone to subscribers to avoid accidental mutation
    const snapshot = {
      draftBlocks: this._state.draftBlocks.map(b => ({ ...b })),
      publishedArticles: this._state.publishedArticles.map(a => ({ ...a, blocks: a.blocks.map(b => ({ ...b })) })),
      filters: { ...this._state.filters }
    };
    for (const fn of this._subs) {
      try { fn(snapshot); } catch (e) { console.error('subscriber error', e); }
    }
  }

  subscribe(fn) {
    this._subs.add(fn);
    fn(this.getState()); // immediate initial push
    return () => this._subs.delete(fn);
  }

  getState() {
    // return a snapshot
    return {
      draftBlocks: this._state.draftBlocks.map(b => ({ ...b })),
      publishedArticles: this._state.publishedArticles.map(a => ({ ...a, blocks: a.blocks.map(b => ({ ...b })) })),
      filters: { ...this._state.filters }
    };
  }

  setFilter(patch) {
    this._state.filters = { ...this._state.filters, ...patch };
    this._persist();
    this._emit();
  }

  addBlock({ type = 'paragraph', content = '', url = '', meta = {} } = {}) {
    const block = { id: genId(), type, content, url, meta, createdAt: Date.now() };
    // prepend to keep newest at top like Medium's quick add
    this._state.draftBlocks = [block, ...this._state.draftBlocks];
    this._persist();
    this._emit();
    return block;
  }

  updateBlock(id, patch = {}) {
    const idx = this._state.draftBlocks.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this._state.draftBlocks[idx] = { ...this._state.draftBlocks[idx], ...patch, updatedAt: Date.now() };
    this._persist();
    this._emit();
    return this._state.draftBlocks[idx];
  }

  deleteBlock(id) {
    this._state.draftBlocks = this._state.draftBlocks.filter(b => b.id !== id);
    this._persist();
    this._emit();
  }

  moveBlock(id, direction) {
    // direction: 'up' or 'down'
    const arr = this._state.draftBlocks;
    const idx = arr.findIndex(b => b.id === id);
    if (idx === -1) return;
    let target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= arr.length) return; // no-op if out of range
    // swap
    const copy = arr.slice();
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    this._state.draftBlocks = copy;
    this._persist();
    this._emit();
  }

  publishArticle(title = '') {
    if (!title.trim()) throw new Error('Title required to publish');
    if (!this._state.draftBlocks.length) throw new Error('No draft blocks to publish');

    // copy blocks snapshot for article
    const blocks = this._state.draftBlocks.map(b => ({ ...b }));
    const article = { id: genId(), title: title.trim(), blocks, createdAt: Date.now() };
    // prepend to published
    this._state.publishedArticles = [article, ...this._state.publishedArticles];
    // clear drafts
    this._state.draftBlocks = [];
    this._persist();
    this._emit();
    return article;
  }

  deleteArticle(id) {
    this._state.publishedArticles = this._state.publishedArticles.filter(a => a.id !== id);
    this._persist();
    this._emit();
  }

  // helpful test hook
  seedDemo() {
    this._state.draftBlocks = [
      { id: genId(), type: 'paragraph', content: 'Welcome to the block editor. Edit this paragraph inline.', createdAt: Date.now() - 50000 },
      { id: genId(), type: 'image', url: 'https://via.placeholder.com/600x200', content: '', createdAt: Date.now() - 40000 },
      { id: genId(), type: 'paragraph', content: 'You can add images and videos, reorder blocks, and publish an article.', createdAt: Date.now() - 30000 }
    ];
    this._persist();
    this._emit();
  }
}

export const store = new Store();
