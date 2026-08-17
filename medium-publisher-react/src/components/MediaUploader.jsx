import React from 'react'

export default function MediaUploader({ onSelect }) {
  const fileRef = React.useRef(null);
  const [url, setUrl] = React.useState('');

  const onFile = (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ()=> onSelect(reader.result);
    reader.readAsDataURL(f);
  }

  const useUrl = ()=>{
    if (!url) return;
    onSelect(url);
    setUrl('');
  }

  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <input type="file" ref={fileRef} onChange={onFile} accept="image/*,video/*" />
      <input style={{flex:1}} placeholder="Paste URL" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&useUrl()} />
      <button onClick={useUrl}>Use URL</button>
    </div>
  )
}
