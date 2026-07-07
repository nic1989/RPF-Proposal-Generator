import React from "react";
import { Users } from "lucide-react";

export default function Team() {
  return (
    <div className="p-8 lg:p-12 max-w-4xl">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#52525b] mb-2">Team</div>
        <h1 className="font-display font-black text-4xl tracking-tight">Collaboration</h1>
      </div>
      <div className="border border-dashed border-[#e4e4e7] rounded-xl p-16 text-center" data-testid="team-placeholder">
        <Users className="w-8 h-8 mx-auto mb-3 text-[#a1a1aa]" />
        <div className="font-display font-bold text-xl mb-2">Coming soon</div>
        <div className="text-sm text-[#52525b] max-w-md mx-auto">
          Invite teammates, assign proposal sections, and review changes together. Available in the next release.
        </div>
      </div>
    </div>
  );
}
