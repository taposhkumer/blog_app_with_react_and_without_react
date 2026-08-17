import React from 'react'
import { StoreProvider, useStore } from './store.jsx'
import BlogBlock from './components/BlogBlock'
import ArticleCard from './components/ArticleCard'
import StatBadge from './components/StatBadge'
import './styles.css'

function Metrics() {
  const { state } = useStore();
  const totalArticles = state.publishedArticles.length;
  const totalDraftBlocks = state.draftBlocks.length;
  const totalWords = state.draftBlocks.reduce((sum, b) => sum + ((b.type==='paragraph' && b.content) ? b.content.split(/\s+/).filter(Boolean).length : 0), 0);
  return (
    <div>
      <StatBadge label="Published" value={totalArticles} />
      <StatBadge label="Draft Blocks" value={totalDraftBlocks} />
      <StatBadge label="Word Count" value={totalWords} />
    </div>
  )
}

function DraftList({ onPublishedRequest }) {
  const { state, dispatch } = useStore();
  const q = (state.filters && state.filters.search || '').trim().toLowerCase();
  const blocks = state.draftBlocks.filter(b => {
    if (!q) return true;
    const hay = (b.content || '') + ' ' + (b.url || '');
    return hay.toLowerCase().includes(q);
  });
  if (!blocks.length) return <div className="block-fallback">No draft blocks. Add one.</div>
  return (
    <div className="draft-list">
      {blocks.map(b => (
        <BlogBlock
          key={b.id}
          block={b}
          onUpdate={(id,patch)=>dispatch({type:'updateBlock',payload:{id,patch}})}
          onDelete={(id)=>dispatch({type:'deleteBlock',payload:{id}})}
          onMove={(id,d)=>dispatch({type:'moveBlock',payload:{id,direction:d}})}
          onSave={(id,content)=>{
            // update block content first
            dispatch({type:'updateBlock',payload:{id,patch:{content}}});
            // then publish the entire draft as an article synchronously constructed here
            const titleInput = document.getElementById('publish-title');
            let title = titleInput && titleInput.value ? titleInput.value.trim() : '';
            if (!title) {
              title = window.prompt('Enter article title for publishing', 'Untitled Article') || 'Untitled Article';
            }
            try {
              const article = { id: (window.crypto && window.crypto.randomUUID) ? crypto.randomUUID() : 'id_'+Math.random().toString(36).slice(2,9), title, blocks: state.draftBlocks.map(bb => ({ ...bb, content: bb.id === id ? content : bb.content })), createdAt: Date.now() };
              dispatch({type:'publishArticleDirect', payload:{ article }});
              // notify parent to preview newly published article with the article object
              if (typeof onPublishedRequest === 'function') onPublishedRequest(article);
            } catch (err) {
              alert(err.message || 'Publish failed');
            }
          }}
        />
      ))}
    </div>
  )
}

function PublishedList() {
  const { state, dispatch } = useStore();
  return (
    <div>
      {state.publishedArticles.map(a => (
        <ArticleCard
          key={a.id}
          article={a}
          onDelete={(id)=>dispatch({type:'deleteArticle',payload:{id}})}
          onEdit={(id)=>{
            const article = state.publishedArticles.find(x => x.id === id);
            if (!article) return;
            // load article blocks back into draft for editing
            dispatch({type:'loadDraftFromArticle', payload:{blocks: article.blocks}});
          }}
        />
      ))}
    </div>
  )
}

export default function AppShell() {
  return (
    <StoreProvider>
      <div className="container">
        <header className="header">
          <div className="title"><h1>Mini Medium — React</h1><p className="muted">React blueprint (Vite)</p></div>
          <div id="metrics"><Metrics/></div>
        </header>
        <Main/>
      </div>
    </StoreProvider>
  )
}

function Main() {
  const { state, dispatch } = useStore();
  const [type, setType] = React.useState('paragraph');
  const [search, setSearch] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [previewRequested, setPreviewRequested] = React.useState(false);
  const [previewArticle, setPreviewArticle] = React.useState(null);

  React.useEffect(()=>{
    // sync local search input to store filter
    const id = setTimeout(()=>dispatch({type:'setFilter',payload:{search}}), 150);
    return ()=>clearTimeout(id);
  },[search,dispatch]);

  // When a publish was requested by a child, the store will update publishedArticles.
  // Observe the store and when previewRequested is true, pick the latest article and open preview.
  React.useEffect(()=>{
    if (previewRequested && state.publishedArticles && state.publishedArticles.length) {
      setPreviewArticle(state.publishedArticles[0]);
      setPreviewRequested(false);
    }
  }, [state.publishedArticles, previewRequested]);

  // If parent provided an article directly in onPublishedRequest, it will set previewArticle via the callback.


  const addBlock = ()=>dispatch({type:'addBlock',payload:{type}});
  const publish = ()=>{
    try{ dispatch({type:'publishArticle',payload:{title}}); setTitle(''); }catch(e){alert(e.message)}
  }

  return (
    <main className="main-grid">
      <section className="editor">
        <div className="editor-controls">
          <div className="row">
            <label>Add Block</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              <option value="paragraph">Paragraph</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <button onClick={addBlock}>Add</button>
          </div>
          <div className="row">
            <label>Search</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter blocks" />
          </div>
          <div className="row publish-row">
            <input id="publish-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Article title..." />
            <button onClick={publish}>Publish</button>
          </div>
        </div>
        <div className="draft-area"><h2>Draft Blocks</h2><DraftList onPublishedRequest={(article)=>{ if (article) setPreviewArticle(article); else setPreviewRequested(true); }} /></div>
      </section>
      <aside className="sidebar"><h2>Published</h2><PublishedList/></aside>

      {previewArticle && (
        <div className="preview-overlay" onClick={()=>setPreviewArticle(null)}>
          <div className="preview-dialog" onClick={e=>e.stopPropagation()}>
            <h2>{previewArticle.title}</h2>
            <div>
              {previewArticle.blocks.map(b=> b.type==='paragraph' ? <p key={b.id}>{b.content}</p> : b.type==='image' ? <img key={b.id} src={b.url} style={{maxWidth:'100%'}}/> : <video key={b.id} src={b.url} controls style={{maxWidth:'100%'}}/>)}
            </div>
            <div style={{textAlign:'right',marginTop:12}}><button onClick={()=>setPreviewArticle(null)}>Close</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
