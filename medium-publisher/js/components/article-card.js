// article-card.js
// Simple card to display a published article in the sidebar. Emits 'delete-article' and 'preview-article' events.

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{display:block}
    .card{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.03)}
    .title{font-weight:700}
    .meta{font-size:0.85rem;color:var(--muted)}
    .actions{display:flex;gap:6px}
    .btn{background:transparent;border:1px solid rgba(255,255,255,0.04);padding:6px 8px;border-radius:6px;color:var(--muted);cursor:pointer}
  </style>
  <div class="card">
    <div>
      <div class="title"></div>
      <div class="meta"></div>
    </div>
    <div class="actions">
      <button class="btn preview">Preview</button>
      <button class="btn delete">Delete</button>
    </div>
  </div>
`;

class ArticleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(tpl.content.cloneNode(true));
    this.$title = this.shadowRoot.querySelector('.title');
    this.$meta = this.shadowRoot.querySelector('.meta');
    this.$preview = this.shadowRoot.querySelector('.preview');
    this.$delete = this.shadowRoot.querySelector('.delete');

    this._onPreview = this._onPreview.bind(this);
    this._onDelete = this._onDelete.bind(this);
  }

  connectedCallback() {
    this.$preview.addEventListener('click', this._onPreview);
    this.$delete.addEventListener('click', this._onDelete);
    this._render();
  }

  disconnectedCallback() {
    this.$preview.removeEventListener('click', this._onPreview);
    this.$delete.removeEventListener('click', this._onDelete);
  }

  set article(a) {
    this._article = a;
    this._render();
  }

  _render() {
    if (!this._article) return;
    this.$title.textContent = this._article.title || 'Untitled';
    this.$meta.textContent = new Date(this._article.createdAt).toLocaleString();
  }

  _onPreview() {
    this.dispatchEvent(new CustomEvent('preview-article', {
      detail: { id: this._article.id },
      bubbles: true,
      composed: true
    }));
  }

  _onDelete() {
    this.dispatchEvent(new CustomEvent('delete-article', {
      detail: { id: this._article.id },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('article-card', ArticleCard);
