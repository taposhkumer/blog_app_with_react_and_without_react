import React from 'react'

export default function ArticleCard({ article, onDelete, onEdit }){
  const [open, setOpen] = React.useState(false);
  return (
    <div className="article-card">
      <div>
        <div style={{fontWeight:700}}>{article.title}</div>
        <div style={{fontSize:12,color:'#94a3b8'}}>{new Date(article.createdAt).toLocaleString()}</div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>setOpen(true)}>Preview</button>
        <button onClick={()=>onEdit && onEdit(article.id)}>Edit</button>
        <button onClick={()=>onDelete(article.id)}>Delete</button>
      </div>
      {open && (
        <div className="preview-overlay" onClick={()=>setOpen(false)}>
          <div className="preview-dialog" onClick={e=>e.stopPropagation()}>
            <h2>{article.title}</h2>
            <div>
              {article.blocks.map(b=> b.type==='paragraph' ? <p key={b.id}>{b.content}</p> : b.type==='image' ? <img key={b.id} src={b.url} style={{maxWidth:'100%'}}/> : <video key={b.id} src={b.url} controls style={{maxWidth:'100%'}}/>)}
            </div>
            <div style={{textAlign:'right',marginTop:12}}><button onClick={()=>setOpen(false)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
