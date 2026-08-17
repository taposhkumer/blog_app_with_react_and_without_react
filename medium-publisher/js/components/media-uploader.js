// media-uploader.js
// Presents file input + URL input. When media is selected (file or URL) it dispatches
// a 'media-selected' CustomEvent with detail {type:'image'|'video', url: dataUrlOrProvidedUrl}
// Event is bubbled and composed so it crosses shadow boundaries.

const tpl = document.createElement('template');
tpl.innerHTML = `
  <style>
    :host{display:block}
    .wrap{display:flex;gap:8px;align-items:center}
    input[type="file"]{background:transparent}
    .url{flex:1;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:inherit}
    .btn{padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:var(--muted);cursor:pointer}
  </style>
  <div class="wrap">
    <input type="file" accept="image/*,video/*" />
    <input type="text" class="url" placeholder="Paste media URL and press Enter" />
    <button class="btn">Use URL</button>
  </div>
`;

class MediaUploader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(tpl.content.cloneNode(true));
    this.$file = this.shadowRoot.querySelector('input[type="file"]');
    this.$url = this.shadowRoot.querySelector('.url');
    this.$btn = this.shadowRoot.querySelector('.btn');

    this._onFile = this._onFile.bind(this);
    this._onKey = this._onKey.bind(this);
    this._onBtn = this._onBtn.bind(this);
  }

  connectedCallback() {
    this.$file.addEventListener('change', this._onFile);
    this.$url.addEventListener('keydown', this._onKey);
    this.$btn.addEventListener('click', this._onBtn);
  }

  disconnectedCallback() {
    this.$file.removeEventListener('change', this._onFile);
    this.$url.removeEventListener('keydown', this._onKey);
    this.$btn.removeEventListener('click', this._onBtn);
  }

  _onBtn() {
    const v = this.$url.value.trim();
    if (!v) return;
    // Determine type by extension very simply
    const type = v.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image';
    this._emit(v, type);
  }

  _onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._onBtn();
    }
  }

  _onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const type = f.type && f.type.startsWith('video') ? 'video' : 'image';
      this._emit(dataUrl, type);
    };
    reader.readAsDataURL(f);
  }

  _emit(url, type) {
    this.dispatchEvent(new CustomEvent('media-selected', {
      detail: { url, type },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('media-uploader', MediaUploader);
