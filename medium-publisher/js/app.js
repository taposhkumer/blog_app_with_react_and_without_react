// app.js
// Main orchestrator. Wires DOM to the Store and registers Web Components.
//
// Main rules:
// - All UI actions call Store methods first (state-first).
// - Store persists and emits snapshot; app subscribes and re-renders (state -> DOM).
// - Child components dispatch CustomEvents (bubbles + composed) that the app listens to
//   and translates into Store calls.

import { store } from './store.js';
import './components/blog-block.js';
import './components/media-uploader.js';
import './components/stat-badge.js';
import './components/article-card.js';

// DOM references
const draftList = document.getElementById('draft-list');
const publishedList = document.getElementById('published-list');
const metricsRoot = document.getElementById('metrics');

const addBtn = document.getElementById('add-block-btn');
const newBlockType = document.getElementById('new-block-type');
const searchInput = document.getElementById('search-input');
const publishBtn = document.getElementById('publish-btn');
const publishTitle = document.getElementById('publish-title');

const computeWordCount = (blocks) => {
  let count = 0;
  for (const b of blocks) {
    if (b.type === 'paragraph' && b.content) {
      count += b.content.split(/\s+/).filter(Boolean).length;
    }
  }
  return count;
};

// render metrics header using stat-badge components
function renderMetrics(state) {
  metricsRoot.innerHTML = '';
  const totalArticles = state.publishedArticles.length;
  const totalDraftBlocks = state.draftBlocks.length;
  const totalWords = computeWordCount(state.draftBlocks);

  const createBadge = (label, value) => {
    const el = document.createElement('stat-badge');
    // stat-badge exposes setStat method
    el.setStat(label, value);
    return el;
  };

  metricsRoot.appendChild(createBadge('Published Articles', totalArticles));
  metricsRoot.appendChild(createBadge('Blocks in Draft', totalDraftBlocks));
  metricsRoot.appendChild(createBadge('Draft Word Count', totalWords));
}

// Render draft blocks list from state snapshot.
// Important: we always reconstruct DOM from state (state -> DOM). Do not mutate DOM to become source of truth.
function renderDraftBlocks(state) {
  // Apply filter (from store)
  const q = (state.filters && state.filters.search || '').trim().toLowerCase();

  draftList.innerHTML = '';
  const blocks = (state.draftBlocks || []).filter(b => {
    if (!q) return true;
    const hay = (b.content || '') + ' ' + (b.url || '');
    return hay.toLowerCase().includes(q);
  });

  if (!blocks.length) {
    const empty = document.createElement('div');
    empty.className = 'block-fallback';
    empty.textContent = 'No draft blocks. Add a block to get started.';
    draftList.appendChild(empty);
    return;
  }

  for (const block of blocks) {
    const el = document.createElement('blog-block');
    el.className = 'blog-block-host';
    el.block = block; // set property - component renders itself
    draftList.appendChild(el);
  }
}

// Render published article list (sidebar)
function renderPublished(state) {
  publishedList.innerHTML = '';
  for (const a of (state.publishedArticles || [])) {
    const card = document.createElement('article-card');
    card.article = a;
    card.addEventListener('preview-article', (e) => {
      const id = e.detail.id;
      const article = (store.getState().publishedArticles || []).find(x => x.id === id);
      if (article) showPreview(article);
    });
    card.addEventListener('delete-article', (e) => {
      store.deleteArticle(e.detail.id); // state-first
    });
    publishedList.appendChild(card);
  }
}

// Preview overlay
function showPreview(article) {
  const overlay = document.createElement('div');
  overlay.className = 'preview-overlay';
  overlay.innerHTML = `<div class="preview-dialog">
    <h2>${escapeHtml(article.title)}</h2>
    <div class="article-body"></div>
    <div style="text-align:right;margin-top:12px;"><button id="close-preview">Close</button></div>
  </div>`;
  document.body.appendChild(overlay);
  const bodyEl = overlay.querySelector('.article-body');
  for (const b of article.blocks) {
    if (b.type === 'paragraph') {
      const p = document.createElement('p');
      p.textContent = b.content || '';
      bodyEl.appendChild(p);
    } else if (b.type === 'image') {
      const img = document.createElement('img');
      img.src = b.url || '';
      img.style.maxWidth = '100%';
      bodyEl.appendChild(img);
    } else if (b.type === 'video') {
      const v = document.createElement('video');
      v.src = b.url || '';
      v.controls = true;
      v.style.maxWidth = '100%';
      bodyEl.appendChild(v);
    }
  }
  overlay.querySelector('#close-preview').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// subscribe to store updates and re-render
store.subscribe((state) => {
  renderMetrics(state);
  renderDraftBlocks(state);
  renderPublished(state);
});

// UI Events -> store actions (state-first)

// Add new block button
addBtn.addEventListener('click', () => {
  const type = newBlockType.value;
  // when adding an image/video block we set url empty and user can click Media inside block to upload
  store.addBlock({ type, content: '', url: '' });
});

// Search input -> set filter in store; store emits and UI re-renders from state
searchInput.addEventListener('input', (e) => {
  store.setFilter({ search: e.target.value || '' });
});

// Publish article: reads title from input, calls store.publishArticle which clears draft and persists
publishBtn.addEventListener('click', () => {
  try {
    const title = publishTitle.value || '';
    const article = store.publishArticle(title);
    publishTitle.value = '';
    // store.publishArticle already emitted the new state; we may show a quick preview
    showPreview(article);
  } catch (err) {
    // simple UX: alert
    alert(err.message || 'Failed to publish');
  }
});

// Child -> parent communication: capture events dispatched by Web Components
// Events are bubbled/composed, so they reach document level or the app root. Handle them here.

// block-update -> update the block in store
document.addEventListener('block-update', (e) => {
  const { id, patch } = e.detail || {};
  if (!id) return;
  store.updateBlock(id, patch);
});

// block-delete -> delete from store
document.addEventListener('block-delete', (e) => {
  const { id } = e.detail || {};
  if (!id) return;
  store.deleteBlock(id);
});

// block-move -> move in store (direction: up/down)
document.addEventListener('block-move', (e) => {
  const { id, direction } = e.detail || {};
  if (!id || !direction) return;
  store.moveBlock(id, direction);
});

// Example: wire global keyboard shortcut to add paragraph block (Cmd/Ctrl+Enter)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    store.addBlock({ type: 'paragraph', content: '' });
  }
});

// Small helper: seed demo if empty (useful for first-run)
(function maybeSeed() {
  const s = store.getState();
  if ((!s.draftBlocks || !s.draftBlocks.length) && (!s.publishedArticles || !s.publishedArticles.length)) {
    store.seedDemo();
  }
})();
