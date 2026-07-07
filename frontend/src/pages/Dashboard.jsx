import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { FileText, Sparkles, Library, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const stat = (label, value, sub, Icon, testid) => (
  <div key={label} data-testid={testid} className="border border-[#e4e4e7] rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-md transition-all bg-white">
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-3">{label}</div>
        <div className="font-display font-black text-4xl leading-none">{value}</div>
        {sub && <div className="text-xs text-[#52525b] mt-2">{sub}</div>}
      </div>
      <Icon className="w-5 h-5 text-[#a1a1aa]" />
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(r => setS(r.data)).catch(() => {});
  }, []);

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">Dashboard</div>
        <h1 className="font-display font-black text-4xl tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "there"}.</h1>
        <p className="text-[#52525b] mt-2">Here's what's happening in your workspace.</p>
      </div>

      <div data-testid="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stat("Active RFPs", s?.active_rfps ?? "—", `${s?.rfps ?? 0} total`, FileText, "stat-rfps")}
        {stat("Proposals", s?.proposals ?? "—", "drafts + submitted", Sparkles, "stat-proposals")}
        {stat("Avg. compliance", `${s?.avg_compliance ?? 0}%`, "across proposals", TrendingUp, "stat-compliance")}
        {stat("Library items", s?.library_items ?? "—", "reusable blocks", Library, "stat-library")}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-[#e4e4e7] rounded-xl p-8 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-1">Recent proposals</div>
              <div className="font-display font-bold text-2xl">Latest activity</div>
            </div>
            <Link to="/app/proposals" data-testid="view-all-proposals" className="text-sm text-[#0055ff] font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(s?.recent_proposals || []).length === 0 && (
              <div className="text-sm text-[#52525b] py-6 text-center border border-dashed border-[#e4e4e7] rounded-lg">
                No proposals yet. <Link to="/app/rfps" className="text-[#0055ff] font-medium">Upload an RFP</Link> to get started.
              </div>
            )}
            {(s?.recent_proposals || []).map(p => (
              <Link key={p.id} to={`/app/proposals/${p.id}`} data-testid={`recent-proposal-${p.id}`}
                className="flex items-center justify-between border border-[#e4e4e7] rounded-lg px-4 py-3 hover:bg-[#fafafa] transition-colors">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-[#52525b] font-mono mt-0.5">{p.updated_at?.slice(0,10)}</div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-display font-black text-2xl">{p.compliance_score || 0}<span className="text-sm text-[#52525b]">%</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-[#52525b]">Compliance</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border border-[#e4e4e7] rounded-xl p-8 bg-black text-white">
          <div className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">Quick start</div>
          <div className="font-display font-black text-2xl mb-6 leading-tight">Bring in a new tender.</div>
          <p className="text-white/70 text-sm mb-8">Upload a PDF or DOCX. We extract requirements automatically.</p>
          <Link to="/app/rfps" data-testid="quickstart-new-rfp"
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-[#f4f4f5] px-5 py-2.5 rounded-lg font-semibold transition-colors">
            <FileText className="w-4 h-4" /> New RFP
          </Link>
        </div>
      </div>
    </div>
  );
}
