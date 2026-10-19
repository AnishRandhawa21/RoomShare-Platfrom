"use client";

interface AuthSegmentedSwitchProps {
  activeTab: "login" | "signup";
  onChange: (tab: "login" | "signup") => void;
}

export function AuthSegmentedSwitch({ activeTab, onChange }: AuthSegmentedSwitchProps) {
  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#E8EAE5]/50 border border-[#E8EAE5] select-none"
    >
      <button
        type="button"
        role="tab"
        id="tab-login"
        aria-selected={activeTab === "login"}
        aria-controls="auth-panel-login"
        onClick={() => onChange("login")}
        className={`relative z-10 py-2.5 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
          activeTab === "login"
            ? "bg-[#00412E] text-white shadow-md shadow-[#00412E]/20"
            : "text-zinc-600 hover:text-zinc-900"
        }`}
      >
        Login
      </button>

      <button
        type="button"
        role="tab"
        id="tab-signup"
        aria-selected={activeTab === "signup"}
        aria-controls="auth-panel-signup"
        onClick={() => onChange("signup")}
        className={`relative z-10 py-2.5 text-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
          activeTab === "signup"
            ? "bg-[#00412E] text-white shadow-md shadow-[#00412E]/20"
            : "text-zinc-600 hover:text-zinc-900"
        }`}
      >
        Sign Up
      </button>
    </div>
  );
}
