import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Upload } from "lucide-react";

export default function RFPs() {
  const [rfps, setRfps] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", client: "", content: "", filename: "" });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const nav = useNavigate();

  const load = () => api.get("/rfps").then(r => setRfps(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/rfps/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(f => ({ ...f, content: r.data.content, title: f.title || file.name.replace(/\.[^.]+$/, ""), filename: r.data.filename }));
      toast.success(`Extracted ${r.data.chars.toLocaleString()} characters`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const create = async () => {
    if (!form.title || !form.content) { toast.error("Title and content are required"); return; }
    setCreating(true);
    try {
      const r = await api.post("/rfps", form);
      toast.success("RFP created");
      setShowNew(false);
      setForm({ title: "", client: "", content: "", filename: "" });
      nav(`/app/rfps/${r.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally {
      setCreating(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this RFP and its proposals?")) return;
    await api.delete(`/rfps/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">RFPs</div>
          <h1 className="font-display font-black text-4xl tracking-tight">Tender & RFP intake</h1>
        </div>
        <button data-testid="new-rfp-btn" onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold transition-colors">
          <Plus className="w-4 h-4" /> New RFP
        </button>
      </div>

      {showNew && (
        <div className="border border-[#e4e4e7] rounded-xl p-8 mb-8 bg-white" data-testid="new-rfp-form">
          <div className="font-display font-bold text-xl mb-6">New RFP</div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <input data-testid="rfp-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff]" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Client</label>
              <input data-testid="rfp-client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff]" />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">Upload PDF / DOCX / TXT (auto-extracts text)</label>
            <div className="flex items-center gap-3">
              <input ref={fileRef} data-testid="rfp-file-input" type="file" accept=".pdf,.docx,.txt,.md" onChange={upload} className="hidden" />
              <button data-testid="rfp-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2.5 rounded-lg text-sm font-medium">
                <Upload className="w-4 h-4" /> {uploading ? "Extracting..." : "Choose file"}
              </button>
              {form.filename && <span className="text-sm text-[#52525b] font-mono">{form.filename}</span>}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium mb-1.5 block">RFP content *</label>
            <textarea data-testid="rfp-content" rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Paste the RFP text here, or upload a file above."
              className="w-full border border-[#e4e4e7] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055ff] font-mono text-sm leading-relaxed" />
          </div>

          <div className="flex gap-3">
            <button data-testid="rfp-create-btn" disabled={creating} onClick={create}
              className="bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-60">
              {creating ? "Creating..." : "Create RFP"}
            </button>
            <button onClick={() => setShowNew(false)} className="border border-[#e4e4e7] hover:bg-[#f4f4f5] px-5 py-2.5 rounded-lg font-medium">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {rfps.length === 0 && !showNew && (
          <div className="border border-dashed border-[#e4e4e7] rounded-xl p-16 text-center">
            <FileText className="w-8 h-8 mx-auto mb-3 text-[#a1a1aa]" />
            <div className="font-display font-bold text-xl mb-2">No RFPs yet</div>
            <div className="text-sm text-[#52525b] mb-6">Upload your first tender to extract requirements.</div>
            <button onClick={() => setShowNew(true)} data-testid="empty-new-rfp"
              className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold">
              <Plus className="w-4 h-4" /> Create your first RFP
            </button>
          </div>
        )}
        {rfps.map(r => (
          <div key={r.id} data-testid={`rfp-card-${r.id}`}
            className="border border-[#e4e4e7] rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4">
            <Link to={`/app/rfps/${r.id}`} className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg truncate">{r.title}</div>
              <div className="flex items-center gap-4 text-sm text-[#52525b] mt-1">
                {r.client && <span>{r.client}</span>}
                <span className="font-mono text-xs">{r.created_at?.slice(0,10)}</span>
                <span className="text-xs">{r.requirements?.length || 0} requirements</span>
              </div>
            </Link>
            <button data-testid={`rfp-delete-${r.id}`} onClick={() => del(r.id)}
              className="p-2 text-[#52525b] hover:text-[#ef4444] hover:bg-[#fee] rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
