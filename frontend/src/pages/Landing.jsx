import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, Gauge, Library, Sparkles } from "lucide-react";

const features = [
  { icon: FileText, title: "Ingest any RFP", desc: "Upload PDF or DOCX tenders. We parse the text, no manual copy-paste." },
  { icon: Sparkles, title: "AI-drafted responses", desc: "GPT-5.2 or Claude Sonnet 4.5 generates a full proposal aligned to every requirement." },
  { icon: Gauge, title: "Compliance scoring", desc: "Per-requirement coverage audit with confidence scoring and evidence." },
  { icon: Library, title: "Reusable content library", desc: "Save winning sections. The AI reuses them contextually in future proposals." },
];

const steps = [
  { n: "01", t: "Upload the RFP", d: "PDF or DOCX. We extract the raw text." },
  { n: "02", t: "Extract requirements", d: "One click — get a categorised, prioritised checklist." },
  { n: "03", t: "Generate the draft", d: "The AI writes an executive summary and all sections." },
  { n: "04", t: "Score & export", d: "Compliance audit, then export polished DOCX or PDF." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-[#09090b]">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-display font-black text-lg">P</div>
            <div className="font-display font-black text-lg tracking-tight">ProposalForge</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" data-testid="nav-login" className="text-sm font-medium text-[#27272a] hover:text-[#09090b] px-3 py-2">Log in</Link>
            <Link to="/register" data-testid="nav-signup" className="text-sm font-semibold bg-black text-white hover:bg-[#27272a] px-4 py-2 rounded-lg transition-colors">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 border border-[#e4e4e7] px-3 py-1 rounded-full text-xs font-medium text-[#52525b] mb-6">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" /> New — Compliance audit v2
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Turn RFPs into winning proposals — in <span className="underline decoration-[#0055ff] decoration-[6px] underline-offset-4">hours</span>, not weeks.
            </h1>
            <p className="mt-6 text-lg text-[#52525b] max-w-xl leading-relaxed">
              ProposalForge reads tenders, RFPs and RFQs, extracts every requirement, drafts a full response, and scores your compliance — so your best team stops copy-pasting.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" data-testid="hero-cta-signup" className="inline-flex items-center gap-2 bg-black text-white hover:bg-[#27272a] px-6 py-3 rounded-lg font-semibold transition-colors">
                Start drafting — free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" data-testid="hero-cta-login" className="inline-flex items-center gap-2 border border-[#e4e4e7] hover:bg-[#f4f4f5] px-6 py-3 rounded-lg font-semibold transition-colors">
                Sign in
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[#52525b]">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10b981]" /> No credit card</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10b981]" /> GPT-5.2 & Claude 4.5</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Export to DOCX / PDF</div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#e4e4e7] bg-[#fafafa]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e4e4e7]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#e4e4e7]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#e4e4e7]" />
                <div className="ml-3 text-xs text-[#52525b] font-mono">proposalforge.app</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#52525b]">Compliance</div>
                <div className="flex items-end justify-between">
                  <div className="font-display font-black text-6xl">92<span className="text-2xl text-[#52525b]">%</span></div>
                  <div className="text-sm text-[#10b981] font-medium">18 / 20 covered</div>
                </div>
                <div className="h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0055ff]" style={{ width: "92%" }} />
                </div>
                <div className="pt-3 border-t border-[#e4e4e7] space-y-2">
                  {["ISO 27001 certification", "24/7 SLA within 15 min", "5+ years reference clients"].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[#e4e4e7] bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="max-w-2xl mb-16">
            <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-3">The platform</div>
            <h2 className="font-display font-black text-3xl lg:text-5xl tracking-tight">Everything your bid team keeps hacking together — in one place.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-[#e4e4e7] rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
                <f.icon className="w-6 h-6 mb-4" />
                <div className="font-display font-bold text-lg mb-2">{f.title}</div>
                <div className="text-sm text-[#52525b] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-3">How it works</div>
              <h2 className="font-display font-black text-3xl lg:text-4xl tracking-tight leading-tight">From tender PDF to submission-ready proposal in four steps.</h2>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="border border-[#e4e4e7] rounded-xl p-6">
                  <div className="font-mono text-xs text-[#0055ff] mb-4">STEP {s.n}</div>
                  <div className="font-display font-bold text-xl mb-2">{s.t}</div>
                  <div className="text-sm text-[#52525b]">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e4e4e7] bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display font-black text-3xl lg:text-5xl tracking-tight leading-tight">Your next tender deserves better than a Google Doc.</h2>
            <p className="mt-4 text-white/70 max-w-lg">Try ProposalForge free. Upload one RFP, generate the draft, export the DOCX. No card required.</p>
          </div>
          <div className="flex md:justify-end">
            <Link to="/register" data-testid="cta-signup" className="inline-flex items-center gap-2 bg-white text-black hover:bg-[#f4f4f5] px-6 py-3 rounded-lg font-semibold transition-colors">
              Create your workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between text-sm text-[#52525b]">
          <div>© 2026 ProposalForge</div>
          <div className="font-mono text-xs">Built for B2B service teams worldwide.</div>
        </div>
      </footer>
    </div>
  );
}
