import React from 'react'
import MediaUploader from './MediaUploader'

// BlogBlock mirrors the vanilla Web Component's behavior using props + callbacks.
// It is a controlled-ish component: edits are kept locally and committed via onUpdate.

export default function BlogBlock({ block, onUpdate, onDelete, onMove }) {
  const [content, setContent] = React.useState(block.content || '');

  // Keep local content in sync with block updates from the global store.
  // Depend on block.content (and block.id) so that when the store updates the block
  // this component's textarea reflects the latest value.
  React.useEffect(()=>{ setContent(block.content || ''); },[block.id, block.content]);

  const save = ()=>{
    // If parent provided onSave, prefer that (it may publish the entire draft)
    if (typeof onSave === 'function') {
      onSave(block.id, content);
    } else {
      onUpdate(block.id, { content });
    }
  }
  const handleMedia = (url)=>{
    onUpdate(block.id, { url });
  }

  return (
    <div className="task-card">
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <div>{block.type}</div>
        <div style={{fontSize:'0.8rem'}}>{new Date(block.createdAt).toLocaleTimeString()}</div>
      </div>

      <div style={{marginTop:8}}>
        {block.type==='paragraph' ? (
          <textarea value={content} onChange={e=>setContent(e.target.value)} style={{width:'100%',minHeight:80}} />
        ) : (
          <div>
            {block.url ? (block.type==='image' ? <img src={block.url} alt="" style={{maxWidth:'100%'}} /> : <video src={block.url} controls style={{maxWidth:'100%'}} />) : <div className="block-fallback">No media</div>}
          </div>
        )}
      </div>

      <div className="block-actions">
        <button className="small-btn" onClick={()=>onMove(block.id,'up')}>↑</button>
        <button className="small-btn" onClick={()=>onMove(block.id,'down')}>↓</button>
        <button className="small-btn" onClick={()=>onDelete(block.id)}>Delete</button>
        <button className="small-btn" onClick={save}>Save</button>
        <button className="small-btn" onClick={()=>{/* show uploader toggle */}}>Media</button>
      </div>

      {/* inline media uploader */}
      <div style={{marginTop:8}}>
        <MediaUploader onSelect={handleMedia} />
      </div>
    </div>
  )
}
