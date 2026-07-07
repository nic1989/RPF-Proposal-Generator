import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ListChecks, Sparkles } from "lucide-react";

const priorityStyles = {
  must: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
  should: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
  nice: "bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]",
};

export default function RFPDetail() {
  const { id } = useParams();
  const [rfp, setRfp] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const nav = useNavigate();

  const load = () => api.get(`/rfps/${id}`).then(r => setRfp(r.data));
  useEffect(() => { load(); }, [id]);

  const extract = async () => {
    setExtracting(true);
    try {
      const r = await api.post(`/rfps/${id}/extract`);
      setRfp(r.data);
      toast.success(`Extracted ${r.data.requirements.length} requirements`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Extraction failed");
    } finally { setExtracting(false); }
  };

  const startProposal = async () => {
    setGenerating(true);
    try {
      const r = await api.post(`/proposals`, { rfp_id: id, title: `Proposal — ${rfp.title}` });
      toast.success("Proposal created");
      nav(`/app/proposals/${r.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    } finally { setGenerating(false); }
  };

  if (!rfp) return <div className="p-12 text-[#52525b]">Loading…</div>;

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <Link to="/app/rfps" className="text-sm text-[#52525b] hover:text-[#09090b] inline-flex items-center gap-1 mb-6" data-testid="back-to-rfps">
        <ArrowLeft className="w-4 h-4" /> Back to RFPs
      </Link>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">RFP · {rfp.client || "Unassigned"}</div>
          <h1 className="font-display font-black text-4xl tracking-tight" data-testid="rfp-title-heading">{rfp.title}</h1>
          <div className="text-sm text-[#52525b] mt-2 font-mono">{rfp.created_at?.slice(0,10)} · {(rfp.content || "").length.toLocaleString()} chars</div>
        </div>
        <div className="flex gap-3">
          <button data-testid="extract-btn" onClick={extract} disabled={extracting || !rfp.content}
            className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-4 py-2.5 rounded-lg font-medium disabled:opacity-60">
            <ListChecks className="w-4 h-4" /> {extracting ? "Extracting…" : rfp.requirements?.length ? "Re-extract requirements" : "Extract requirements"}
          </button>
          <button data-testid="start-proposal-btn" onClick={startProposal} disabled={generating}
            className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-4 py-2.5 rounded-lg font-semibold disabled:opacity-60">
            <Sparkles className="w-4 h-4" /> Start proposal
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 border border-[#e4e4e7] rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.2em] text-[#52525b]">Extracted requirements</div>
            <div className="text-sm font-mono">{rfp.requirements?.length || 0}</div>
          </div>
          {(!rfp.requirements || rfp.requirements.length === 0) ? (
            <div className="text-sm text-[#52525b] py-6 text-center border border-dashed border-[#e4e4e7] rounded-lg">
              Click "Extract requirements" to run AI analysis.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1" data-testid="requirements-list">
              {rfp.requirements.map((r, i) => (
                <div key={r.id} className="border border-[#e4e4e7] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${priorityStyles[r.priority] || priorityStyles.should}`}>{r.priority}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#52525b]">{r.category}</span>
                  </div>
                  <div className="text-sm">{r.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-3 border border-[#e4e4e7] rounded-xl p-6 bg-white">
          <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-4">RFP content</div>
          <pre className="whitespace-pre-wrap font-mono text-sm text-[#27272a] leading-relaxed max-h-[600px] overflow-y-auto" data-testid="rfp-content-view">
            {rfp.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
