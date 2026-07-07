import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Workspace ready!");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-display font-black text-lg">P</div>
            <div className="font-display font-black text-lg">ProposalForge</div>
          </Link>
          <h1 className="font-display font-black text-3xl mb-2 tracking-tight">Create your workspace</h1>
          <p className="text-[#52525b] mb-8">Free — no card required.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full name</label>
              <input data-testid="register-name" required value={form.name} onChange={set("name")}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Company</label>
              <input data-testid="register-company" value={form.company} onChange={set("company")}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input data-testid="register-email" type="email" required value={form.email} onChange={set("email")}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input data-testid="register-password" type="password" required minLength={6} value={form.password} onChange={set("password")}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <button data-testid="register-submit" disabled={loading}
              className="w-full bg-black text-white hover:bg-[#27272a] px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60">
              {loading ? "Creating..." : "Create workspace"}
            </button>
          </form>
          <p className="text-sm text-[#52525b] mt-6">
            Already have an account? <Link data-testid="link-login" to="/login" className="text-[#0055ff] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex bg-[#fafafa] relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative max-w-md">
          <div className="text-xs uppercase tracking-[0.3em] text-[#52525b] mb-4">What you unlock</div>
          <ul className="space-y-3 text-[#27272a]">
            {["Unlimited RFP uploads","AI-generated drafts","Compliance scoring","DOCX & PDF export","Reusable content library"].map((t,i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-mono text-xs">{i+1}</div>
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
