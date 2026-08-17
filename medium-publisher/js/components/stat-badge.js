// stat-badge.js
// Simple presentational component for header metrics.
// Use by setting el.setStat(label, value)

const statTpl = document.createElement('template');
statTpl.innerHTML = `
  <style>
    :host { display:inline-block; min-width:110px; margin-right:8px; }
    .box { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.03); color:var(--text); }
    .label{font-size:0.75rem;color:var(--muted)}
    .value{font-weight:700;font-size:1rem}
  </style>
  <div class="box">
    <div class="label"></div>
    <div class="value"></div>
  </div>
`;

class StatBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(statTpl.content.cloneNode(true));
    this.$label = this.shadowRoot.querySelector('.label');
    this.$value = this.shadowRoot.querySelector('.value');
  }

  setStat(label, value) {
    this.$label.textContent = label;
    this.$value.textContent = value;
  }
}

customElements.define('stat-badge', StatBadge);
