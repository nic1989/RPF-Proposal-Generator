import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
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
          <h1 className="font-display font-black text-3xl mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[#52525b] mb-8">Sign in to your workspace.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input data-testid="login-email" required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input data-testid="login-password" required type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-[#e4e4e7] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0055ff] focus:border-transparent" />
            </div>
            <button data-testid="login-submit" disabled={loading}
              className="w-full bg-black text-white hover:bg-[#27272a] px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-[#52525b] mt-6">
            No account? <Link data-testid="link-register" to="/register" className="text-[#0055ff] font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:block bg-black relative overflow-hidden">
        <div className="absolute inset-0 diag-lines opacity-40" />
        <div className="relative h-full flex items-end p-16 text-white">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-white/60 mb-4">Trusted by B2B teams</div>
            <div className="font-display font-black text-4xl leading-tight max-w-md">"We shipped three proposals in a week instead of one a month."</div>
            <div className="mt-6 text-sm text-white/60 font-mono">— Head of Bids, IT Services</div>
          </div>
        </div>
      </div>
    </div>
  );
}
