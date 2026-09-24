import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlusCircle, MessageCircle, Mail } from "lucide-react";

type AdminSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

const navItems = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "New Shipment",
    to: "/admin/new",
    icon: PlusCircle,
  },
  {
    label: "Admin Chat",
    to: "/admin/chat",
    icon: MessageCircle,
  },
  {
    label: "Notifications",
    to: "/admin/notifications",
    icon: Mail,
  },
];

export default function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/admin") {
      return (
        location.pathname === "/admin" ||
        location.pathname.startsWith("/admin/view") ||
        location.pathname.startsWith("/admin/edit")
      );
    }
    return location.pathname.startsWith(to);
  };

  return (
    <aside
      className={`flex h-full w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0B1220] via-[#0F1F3D] to-[#0B1220] text-white ${className ?? ""}`}
    >
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s"
            alt="Buske Logistics logo"
            className="h-10 w-10 rounded-full object-cover shadow-lg"
          />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Admin
            </div>
            <div className="text-lg font-bold text-white">Buske Command</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-white/15 text-white shadow-[0_12px_30px_rgba(15,23,42,0.45)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-white" : "text-white/60"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-6 py-6 text-xs text-white/50">
        Secure admin access
      </div>
    </aside>
  );
}
