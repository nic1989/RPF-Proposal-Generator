import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Library, Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["General", "Company overview", "Case study", "Methodology", "Team bio", "Security & compliance", "Pricing"];

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", category: "General", content: "", tags: "" });

  const load = () => api.get("/library").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.content) { toast.error("Title & content required"); return; }
    await api.post("/library", {
      title: form.title, category: form.category, content: form.content,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    toast.success("Saved to library");
    setShowNew(false);
    setForm({ title: "", category: "General", content: "", tags: "" });
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`/library/${id}`);
    load();
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">Content library</div>
          <h1 className="font-display font-black text-4xl tracking-tight">Reusable proposal blocks</h1>
          <p className="text-[#52525b] mt-2 text-sm">Add your best answers. The AI reuses them when drafting new proposals.</p>
        </div>
        <button data-testid="new-lib-btn" onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold">
          <Plus className="w-4 h-4" /> Add item
        </button>
      </div>

      {showNew && (
        <div className="border border-[#e4e4e7] rounded-xl p-8 mb-8 bg-white" data-testid="new-lib-form">
          <div className="font-display font-bold text-xl mb-6">New content block</div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <input data-testid="lib-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select data-testid="lib-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">Tags (comma-separated)</label>
            <input data-testid="lib-tags" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff]" />
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium mb-1.5 block">Content *</label>
            <textarea data-testid="lib-content" rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className="w-full border border-[#e4e4e7] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055ff] text-sm leading-relaxed" />
          </div>
          <div className="flex gap-3">
            <button data-testid="lib-save" onClick={create} className="bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold">Save</button>
            <button onClick={() => setShowNew(false)} className="border border-[#e4e4e7] hover:bg-[#f4f4f5] px-5 py-2.5 rounded-lg font-medium">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border border-dashed border-[#e4e4e7] rounded-xl p-16 text-center">
          <Library className="w-8 h-8 mx-auto mb-3 text-[#a1a1aa]" />
          <div className="font-display font-bold text-xl mb-2">Empty library</div>
          <div className="text-sm text-[#52525b]">Save your best proposal content here for reuse.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(it => (
            <div key={it.id} data-testid={`lib-item-${it.id}`}
              className="border border-[#e4e4e7] rounded-xl p-5 bg-white hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="font-display font-bold text-lg truncate">{it.title}</div>
                <button data-testid={`lib-delete-${it.id}`} onClick={() => del(it.id)}
                  className="text-[#52525b] hover:text-[#ef4444] p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#52525b] mb-3">{it.category}</div>
              <div className="text-sm text-[#27272a] line-clamp-4 leading-relaxed">{it.content}</div>
              {it.tags?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {it.tags.map(t => <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-[#f4f4f5] border border-[#e4e4e7] rounded">{t}</span>)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
