import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Proposals() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/proposals").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Delete this proposal?")) return;
    await api.delete(`/proposals/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">Proposals</div>
        <h1 className="font-display font-black text-4xl tracking-tight">All proposals</h1>
      </div>
      <div className="grid gap-4">
        {items.length === 0 && (
          <div className="border border-dashed border-[#e4e4e7] rounded-xl p-16 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#a1a1aa]" />
            <div className="font-display font-bold text-xl mb-2">No proposals yet</div>
            <div className="text-sm text-[#52525b] mb-6">Open an RFP and click "Start proposal".</div>
            <Link to="/app/rfps" data-testid="empty-to-rfps" className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-5 py-2.5 rounded-lg font-semibold">
              Go to RFPs
            </Link>
          </div>
        )}
        {items.map(p => (
          <div key={p.id} data-testid={`proposal-card-${p.id}`}
            className="border border-[#e4e4e7] rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-between gap-4">
            <Link to={`/app/proposals/${p.id}`} className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg truncate">{p.title}</div>
              <div className="text-sm text-[#52525b] mt-1 font-mono">{p.updated_at?.slice(0,10)} · {p.sections?.length || 0} sections</div>
            </Link>
            <div className="text-right shrink-0">
              <div className="font-display font-black text-2xl">{p.compliance_score || 0}<span className="text-sm text-[#52525b]">%</span></div>
              <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Compliance</div>
            </div>
            <button data-testid={`proposal-delete-${p.id}`} onClick={() => del(p.id)}
              className="p-2 text-[#52525b] hover:text-[#ef4444] hover:bg-[#fee] rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
