"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, FilePlus2, Globe2, Save, Send, Undo2 } from "lucide-react";

type Post = { id: string; title: string; slug: string; content: string; featuredImage: string; publishedAt: string; status: "published" | "draft"; updatedAt?: string };
const blank = (): Post => ({ id: "", title: "", slug: "", content: "", featuredImage: "", publishedAt: new Date().toISOString().slice(0, 10), status: "draft" });
const toDateInput = (value: string) => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function PreciousBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<Post>(blank());
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/precious-blog", { cache: "no-store" });
      if (response.status === 401) { window.location.replace("/admin/"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Articles could not be loaded.");
      setPosts(data.posts || []);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Articles could not be loaded."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);
  const edit = (post: Post) => { setForm({ ...post, publishedAt: toDateInput(post.publishedAt) }); setIsPreview(false); setNotice(""); };
  const newPost = () => { setForm(blank()); setIsPreview(false); setNotice(""); };
  const update = (field: keyof Post, value: string) => setForm(current => ({ ...current, [field]: value }));

  async function submit(action: "save" | "publish" | "unpublish") {
    setIsSaving(true); setNotice("");
    try {
      const response = await fetch("/api/admin/precious-blog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: form.id, post: { ...form, publishedAt: form.publishedAt ? new Date(`${form.publishedAt}T12:00:00Z`).toISOString() : "" } })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your changes could not be saved.");
      setPosts(data.posts || []); setForm({ ...data.post, publishedAt: toDateInput(data.post.publishedAt) });
      setNotice(action === "publish" ? "Article published." : action === "unpublish" ? "Article unpublished and saved as a draft." : "Draft saved.");
      setIsPreview(false);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Your changes could not be saved."); }
    finally { setIsSaving(false); }
  }

  return <section className="admin-section pm-admin-section">
    <div className="admin-section-head"><div><h1>Precious Metals blog</h1><p>Create, preview and publish articles for the public Metals section.</p></div><a href="/precious-metals/blog/" target="_blank" rel="noreferrer">View public blog</a></div>
    <div className="pm-admin-layout">
      <aside className="admin-panel pm-admin-list"><div className="admin-panel-head"><h2>Articles</h2><button type="button" onClick={newPost}><FilePlus2 size={16} />New article</button></div>
        {isLoading && <p className="admin-notice">Loading articles…</p>}
        {!isLoading && posts.length === 0 && <p className="admin-notice">No articles yet. Start with a draft.</p>}
        <div className="pm-admin-posts">{posts.map(post => <button key={post.id} type="button" className={form.id === post.id ? "selected" : ""} onClick={() => edit(post)}><span>{post.title || "Untitled"}</span><small>{post.status === "published" ? "Published" : "Draft"}</small></button>)}</div>
      </aside>
      <div className="admin-panel pm-admin-editor">
        <div className="admin-panel-head"><h2>{form.id ? "Edit article" : "New article"}</h2><span className={`pm-status-badge ${form.status}`}>{form.status === "published" ? "Published" : "Draft"}</span></div>
        {isPreview ? <article className="pm-admin-preview">
          <p className="pm-admin-date">PlasmaX · {form.publishedAt || "Publication date not set"}</p><h1>{form.title || "Article title"}</h1>
          {form.featuredImage && <img src={form.featuredImage} alt="Featured image preview" />}
          <div>{(form.content || "Your article preview will appear here.").split(/\n\s*\n/).map((block, index) => <p key={index}>{block}</p>)}</div>
        </article> : <div className="pm-admin-fields">
          <label>Title<input value={form.title} maxLength={180} onChange={event => update("title", event.target.value)} placeholder="A clear article title" /></label>
          <label>URL slug<input value={form.slug} maxLength={100} onChange={event => update("slug", event.target.value)} placeholder="article-url" /></label>
          <label>Featured image URL<input type="url" value={form.featuredImage} onChange={event => update("featuredImage", event.target.value)} placeholder="https://…" /></label>
          <label>Publication date<input type="date" value={form.publishedAt} onChange={event => update("publishedAt", event.target.value)} /></label>
          <label className="pm-content-field">Article content<textarea value={form.content} maxLength={30000} onChange={event => update("content", event.target.value)} placeholder="Write the article here. Separate paragraphs with a blank line." rows={15} /><small>{form.content.length.toLocaleString()} / 30,000 characters · Plain text paragraphs</small></label>
        </div>}
        {notice && <p className="pm-admin-notice" role="status">{notice}</p>}
        <div className="pm-admin-actions">
          <button type="button" className="pm-admin-secondary" onClick={() => setIsPreview(value => !value)}><Eye size={16} />{isPreview ? "Back to editor" : "Preview"}</button>
          <button type="button" className="pm-admin-secondary" onClick={() => void submit("save")} disabled={isSaving}><Save size={16} />{form.status === "published" ? "Save changes" : "Save draft"}</button>
          {form.status === "published" ? <button type="button" className="pm-admin-secondary" onClick={() => void submit("unpublish")} disabled={isSaving}><Undo2 size={16} />Unpublish</button> : <button type="button" className="pm-admin-primary" onClick={() => void submit("publish")} disabled={isSaving}><Send size={16} />Publish</button>}
          {form.status === "published" && form.slug && <a className="pm-admin-secondary" href={`/precious-metals/blog/${encodeURIComponent(form.slug)}`} target="_blank" rel="noreferrer"><Globe2 size={16} />Open article</a>}
        </div>
      </div>
    </div>
  </section>;
}
