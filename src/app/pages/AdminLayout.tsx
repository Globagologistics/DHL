import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1220] md:bg-transparent">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0B1220]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Admin
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-white/15 bg-white/5 p-2 text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-50 transition ${
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          } md:hidden`}
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 h-full w-72 transform transition-transform ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <AdminSidebar onNavigate={() => setMobileOpen(false)} className="w-72" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="pt-16 md:pt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
