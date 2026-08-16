"use client";

import { useState, useEffect } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { X } from "lucide-react";

interface AdminLayoutClientProps {
  sidebar?: React.ReactNode; // Optional now
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Read theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin-theme", nextTheme);
  };

  return (
    <div className={`min-h-screen bg-neutral-900 text-white flex flex-col lg:flex-row w-full relative ${theme === "light" ? "admin-light" : ""}`}>
      {/* Mobile Top Header */}
      <AdminHeader onMenuClick={() => setSidebarOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      {/* Desktop Sidebar (visible only on lg screens) */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
      </div>

      {/* Mobile Sidebar Overlay/Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-neutral-950 border-r border-neutral-800 transition-transform duration-300 transform translate-x-0 z-50">
            {/* Close button inside drawer */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white rounded-lg transition-colors z-30"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Sidebar content */}
            <div className="h-full overflow-y-auto" onClick={() => setSidebarOpen(false)}>
              <AdminSidebar theme={theme} onToggleTheme={toggleTheme} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 sm:p-6 lg:p-8 bg-neutral-900 custom-scrollbar w-full">
        {children}
      </main>
    </div>
  );
}
