import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Check, Download, FileText, Gauge, Sparkles, X } from "lucide-react";

const MODELS = [
  { provider: "anthropic", model: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { provider: "openai", model: "gpt-5.2", label: "GPT-5.2" },
];

export default function ProposalEditor() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [model, setModel] = useState(MODELS[0]);
  const [tone, setTone] = useState("professional");

  const load = () => api.get(`/proposals/${id}`).then(r => setP(r.data));
  useEffect(() => { load(); }, [id]);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/proposals/${id}/generate`, { provider: model.provider, model: model.model, tone });
      setP(r.data);
      toast.success("Draft generated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Generation failed");
    } finally { setBusy(false); }
  };

  const score = async () => {
    setScoring(true);
    try {
      const r = await api.post(`/proposals/${id}/score`);
      setP(r.data);
      toast.success(`Compliance: ${r.data.compliance_score}%`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Scoring failed");
    } finally { setScoring(false); }
  };

  const save = async () => {
    try {
      const r = await api.patch(`/proposals/${id}`, {
        title: p.title, executive_summary: p.executive_summary, sections: p.sections,
      });
      setP(r.data);
      toast.success("Saved");
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const exportFile = async (fmt) => {
    const token = localStorage.getItem("token");
    const url = `${API}/proposals/${id}/export?format=${fmt}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { toast.error("Export failed"); return; }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.title}.${fmt}`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  if (!p) return <div className="p-12 text-[#52525b]">Loading…</div>;

  const updateSection = (idx, patch) => {
    const next = [...p.sections];
    next[idx] = { ...next[idx], ...patch };
    setP({ ...p, sections: next });
  };

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <Link to="/app/proposals" className="text-sm text-[#52525b] hover:text-[#09090b] inline-flex items-center gap-1 mb-6" data-testid="back-to-proposals">
        <ArrowLeft className="w-4 h-4" /> Back to proposals
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">Proposal editor</div>
          <input value={p.title} onChange={e => setP({ ...p, title: e.target.value })} data-testid="proposal-title-input"
            className="font-display font-black text-4xl tracking-tight w-full bg-transparent focus:outline-none border-b-2 border-transparent focus:border-[#0055ff] pb-1" />
          <div className="text-sm text-[#52525b] mt-2 font-mono">
            {p.model_used ? `Generated with ${p.model_used}` : "Not yet generated"} · Updated {p.updated_at?.slice(0,10)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <select value={`${model.provider}:${model.model}`} data-testid="model-select"
              onChange={e => { const v = e.target.value; setModel(MODELS.find(m => `${m.provider}:${m.model}` === v)); }}
              className="text-sm border border-[#e4e4e7] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]">
              {MODELS.map(m => <option key={m.model} value={`${m.provider}:${m.model}`}>{m.label}</option>)}
            </select>
            <select value={tone} onChange={e => setTone(e.target.value)} data-testid="tone-select"
              className="text-sm border border-[#e4e4e7] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0055ff]">
              <option value="professional">Professional</option>
              <option value="consultative">Consultative</option>
              <option value="technical">Technical</option>
              <option value="persuasive">Persuasive</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button data-testid="generate-btn" onClick={generate} disabled={busy}
              className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
              <Sparkles className="w-4 h-4" /> {busy ? "Generating…" : p.sections?.length ? "Regenerate" : "Generate draft"}
            </button>
            <button data-testid="score-btn" onClick={score} disabled={scoring || !p.sections?.length}
              className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              <Gauge className="w-4 h-4" /> {scoring ? "Scoring…" : "Score compliance"}
            </button>
            <button data-testid="save-btn" onClick={save} className="border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2 rounded-lg text-sm font-medium">Save</button>
            <button data-testid="export-docx" onClick={() => exportFile("docx")} className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2 rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" /> DOCX
            </button>
            <button data-testid="export-pdf" onClick={() => exportFile("pdf")} className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2 rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="border border-[#e4e4e7] rounded-xl p-6 bg-white">
            <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-3">Executive summary</div>
            <textarea data-testid="exec-summary" rows={5} value={p.executive_summary}
              onChange={e => setP({ ...p, executive_summary: e.target.value })}
              placeholder="Generate the draft or type here…"
              className="w-full border border-[#e4e4e7] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055ff] text-sm leading-relaxed" />
          </section>

          {(p.sections || []).map((s, i) => (
            <section key={s.id} data-testid={`section-${i}`} className="border border-[#e4e4e7] rounded-xl p-6 bg-white">
              <input value={s.heading} onChange={e => updateSection(i, { heading: e.target.value })}
                className="font-display font-bold text-xl w-full bg-transparent focus:outline-none border-b border-transparent focus:border-[#0055ff] pb-1 mb-3" />
              <textarea rows={8} value={s.content} onChange={e => updateSection(i, { content: e.target.value })}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0055ff] text-sm leading-relaxed" />
            </section>
          ))}

          {(!p.sections || p.sections.length === 0) && (
            <div className="border border-dashed border-[#e4e4e7] rounded-xl p-16 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#a1a1aa]" />
              <div className="font-display font-bold text-xl mb-2">Nothing here yet</div>
              <div className="text-sm text-[#52525b] mb-6">Pick a model and generate a first draft.</div>
              <button onClick={generate} disabled={busy}
                className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold">
                <Sparkles className="w-4 h-4" /> Generate draft
              </button>
            </div>
          )}
        </div>

        {/* Compliance sidebar */}
        <aside className="lg:col-span-1">
          <div className="border border-[#e4e4e7] rounded-xl p-6 bg-white sticky top-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-3">Compliance score</div>
            <div className="flex items-end justify-between mb-4">
              <div className="font-display font-black text-5xl" data-testid="compliance-score">
                {p.compliance_score || 0}<span className="text-xl text-[#52525b]">%</span>
              </div>
              <div className="text-xs font-mono text-[#52525b]">{p.compliance_items?.filter(i => i.covered).length || 0} / {p.compliance_items?.length || 0}</div>
            </div>
            <div className="h-2 bg-[#f4f4f5] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-[#0055ff] transition-all" style={{ width: `${p.compliance_score || 0}%` }} />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" data-testid="compliance-list">
              {(p.compliance_items || []).length === 0 && (
                <div className="text-xs text-[#52525b] py-4 text-center border border-dashed border-[#e4e4e7] rounded-lg">
                  Score the proposal to see per-requirement coverage.
                </div>
              )}
              {(p.compliance_items || []).map((c) => (
                <div key={c.requirement_id} className="border border-[#e4e4e7] rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {c.covered
                      ? <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      : <X className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[#27272a] leading-snug">{c.requirement_text}</div>
                      <div className="text-[10px] font-mono text-[#52525b] mt-1">confidence {c.confidence}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
