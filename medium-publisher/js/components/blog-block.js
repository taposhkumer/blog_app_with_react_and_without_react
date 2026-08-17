// blog-block.js
// Web Component representing an editable content block.
// - Input: block object assigned via property .block = { id, type, content, url }
// - Renders different UIs based on type: paragraph (contenteditable), image (preview + edit URL), video (preview + edit URL).
// - Dispatches CustomEvents on actions: 'block-update' (detail { id, patch }), 'block-delete' (detail { id }),
//   'block-move' (detail { id, direction }) where direction is 'up'|'down'.

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{display:block}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.03)}
    .meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .content{min-height:40px;padding:6px;border-radius:6px;background:transparent;border:1px dashed rgba(255,255,255,0.02)}
    .content[contenteditable="true"]:focus{outline:2px solid rgba(124,58,237,0.12)}
    img.preview{max-width:100%;border-radius:6px}
    video.preview{max-width:100%;border-radius:6px}
    .actions{display:flex;gap:6px;justify-content:flex-end;margin-top:8px}
    .btn{background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--muted);padding:6px 8px;border-radius:6px;cursor:pointer}
  </style>

  <article class="card" tabindex="0" role="article">
    <div class="meta">
      <div class="type"></div>
      <div class="time"></div>
    </div>

    <div class="body">
      <div class="content" part="content"></div>
      <div class="media-slot"></div>
    </div>

    <div class="actions">
      <button class="btn move-up" title="Move Up">↑</button>
      <button class="btn move-down" title="Move Down">↓</button>
      <button class="btn edit-media" title="Edit Media">Media</button>
      <button class="btn delete" title="Delete">Delete</button>
      <button class="btn save" title="Save">Save</button>
    </div>
  </article>
`;

class BlogBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(tpl.content.cloneNode(true));
    this.$type = this.shadowRoot.querySelector('.type');
    this.$time = this.shadowRoot.querySelector('.time');
    this.$content = this.shadowRoot.querySelector('.content');
    this.$media = this.shadowRoot.querySelector('.media-slot');
    this.$moveUp = this.shadowRoot.querySelector('.move-up');
    this.$moveDown = this.shadowRoot.querySelector('.move-down');
    this.$delete = this.shadowRoot.querySelector('.delete');
    this.$save = this.shadowRoot.querySelector('.save');
    this.$editMedia = this.shadowRoot.querySelector('.edit-media');

    this._onSave = this._onSave.bind(this);
    this._onDelete = this._onDelete.bind(this);
    this._onMoveUp = this._onMoveUp.bind(this);
    this._onMoveDown = this._onMoveDown.bind(this);
    this._onMediaSelected = this._onMediaSelected.bind(this);
    this._onContentInput = this._onContentInput.bind(this);

    this._block = null;
  }

  connectedCallback() {
    this.$save.addEventListener('click', this._onSave);
    this.$delete.addEventListener('click', this._onDelete);
    this.$moveUp.addEventListener('click', this._onMoveUp);
    this.$moveDown.addEventListener('click', this._onMoveDown);
    this.$editMedia.addEventListener('click', () => this._showMediaUploader());
    this.$content.addEventListener('input', this._onContentInput);
    // Listen for media-selected events that bubble from media-uploader when it's added to DOM
    this.addEventListener('media-selected', this._onMediaSelected);
  }

  disconnectedCallback() {
    this.$save.removeEventListener('click', this._onSave);
    this.$delete.removeEventListener('click', this._onDelete);
    this.$moveUp.removeEventListener('click', this._onMoveUp);
    this.$moveDown.removeEventListener('click', this._onMoveDown);
    this.$content.removeEventListener('input', this._onContentInput);
    this.removeEventListener('media-selected', this._onMediaSelected);
  }

  set block(b) {
    this._block = b;
    this._render();
  }

  get block() {
    return this._block;
  }

  _render() {
    const b = this._block || {};
    this.$type.textContent = b.type || '';
    this.$time.textContent = b.createdAt ? new Date(b.createdAt).toLocaleTimeString() : '';
    // render content
    if (b.type === 'paragraph') {
      this.$content.setAttribute('contenteditable', 'true');
      this.$content.textContent = b.content || '';
      this.$media.innerHTML = '';
    } else if (b.type === 'image') {
      this.$content.setAttribute('contenteditable', 'false');
      this.$content.textContent = b.content || '';
      this.$media.innerHTML = b.url ? `<img class="preview" src="${b.url}" alt="Image block" />` : '<div class="block-fallback">No image</div>';
    } else if (b.type === 'video') {
      this.$content.setAttribute('contenteditable', 'false');
      this.$content.textContent = b.content || '';
      if (b.url) {
        this.$media.innerHTML = `<video class="preview" controls src="${b.url}"></video>`;
      } else {
        this.$media.innerHTML = '<div class="block-fallback">No video</div>';
      }
    } else {
      this.$content.setAttribute('contenteditable', 'true');
      this.$content.textContent = b.content || '';
      this.$media.innerHTML = '';
    }
  }

  _onContentInput() {
    // we keep the input in internal DOM; actual update to store occurs on explicit Save to demonstrate state-first flow.
  }

  _onSave() {
    if (!this._block) return;
    const patch = {};
    if (this._block.type === 'paragraph') {
      patch.content = this.$content.textContent.trim();
    } else {
      // non-paragraph may have an optional caption in content area
      patch.content = this.$content.textContent.trim();
    }
    // dispatch update event - bubbled/composed so app.js can call store.updateBlock
    this.dispatchEvent(new CustomEvent('block-update', {
      detail: { id: this._block.id, patch },
      bubbles: true,
      composed: true
    }));
  }

  _onDelete() {
    if (!this._block) return;
    this.dispatchEvent(new CustomEvent('block-delete', {
      detail: { id: this._block.id },
      bubbles: true,
      composed: true
    }));
  }

  _onMoveUp() {
    if (!this._block) return;
    this.dispatchEvent(new CustomEvent('block-move', {
      detail: { id: this._block.id, direction: 'up' },
      bubbles: true,
      composed: true
    }));
  }

  _onMoveDown() {
    if (!this._block) return;
    this.dispatchEvent(new CustomEvent('block-move', {
      detail: { id: this._block.id, direction: 'down' },
      bubbles: true,
      composed: true
    }));
  }

  _showMediaUploader() {
    // add a media-uploader into the media slot temporarily (it will dispatch media-selected)
    this.$media.innerHTML = '';
    const uploader = document.createElement('media-uploader');
    this.$media.appendChild(uploader);
  }

  _onMediaSelected(e) {
    // media-uploader emits media-selected; we transform into block-update event
    const { url, type } = e.detail || {};
    if (!this._block) return;
    // ensure type matches block type
    if (this._block.type !== type) {
      // if mismatch, ignore or optionally switch type; here we update url and leave type
    }
    this.dispatchEvent(new CustomEvent('block-update', {
      detail: { id: this._block.id, patch: { url } },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('blog-block', BlogBlock);
