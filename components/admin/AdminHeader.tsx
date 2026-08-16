"use client";

import { Menu, Sparkles, Sun, Moon } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  onMenuClick: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function AdminHeader({ onMenuClick, theme, onToggleTheme }: AdminHeaderProps) {
  return (
    <header className="lg:hidden bg-neutral-955 border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle Sidebar Menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-maroonClr flex items-center justify-center border border-[#C9A84C]/20">
            <span className="text-[#C9A84C] font-serif font-bold text-xs">BV</span>
          </div>
          <div>
            <h1 className="font-serif text-xs font-bold text-white flex items-center gap-1">
              Boutiique Vastraa <Sparkles className="w-2.5 h-2.5 text-[#C9A84C]" />
            </h1>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Management</p>
          </div>
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
        aria-label="Toggle Theme"
      >
        {theme === "light" ? (
          <Moon className="w-4.5 h-4.5 text-neutral-600" />
        ) : (
          <Sun className="w-4.5 h-4.5 text-[#C9A84C]" />
        )}
      </button>
    </header>
  );
}
