import React from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { FileText, LayoutDashboard, Library, LogOut, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const nav = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", exact: true, id: "nav-dashboard" },
  { to: "/app/rfps", icon: FileText, label: "RFPs", id: "nav-rfps" },
  { to: "/app/proposals", icon: Sparkles, label: "Proposals", id: "nav-proposals" },
  { to: "/app/library", icon: Library, label: "Content Library", id: "nav-library" },
  { to: "/app/team", icon: Users, label: "Team", id: "nav-team" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-white text-[#09090b]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#e4e4e7] flex flex-col shrink-0" data-testid="sidebar">
        <div className="px-6 py-6 border-b border-[#e4e4e7]">
          <div onClick={() => navigate("/app")} className="cursor-pointer flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-display font-black text-lg">P</div>
            <div>
              <div className="font-display font-black tracking-tight text-lg leading-none">ProposalForge</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#52525b] mt-0.5">RFP Studio</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              data-testid={n.id}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-black text-white" : "text-[#27272a] hover:bg-[#f4f4f5]"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#e4e4e7] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#0055ff] text-white flex items-center justify-center font-semibold text-sm" data-testid="user-avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs text-[#52525b] truncate">{user?.company || user?.email}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-2 justify-center text-sm border border-[#e4e4e7] hover:bg-[#f4f4f5] px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
