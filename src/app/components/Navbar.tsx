import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  const navLinks = [
    { name: "Learn More", path: "/home" },
    { name: "Track Shipment", path: "/track" },
    { name: "Locations", path: "/locations" },
    { name: "Solutions", path: "/solutions" },
    { name: "About", path: "/about" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50"
    >
      <div className="max-w-7xl mx-auto pl-[calc(env(safe-area-inset-left,0px)+1rem)] pr-[calc(env(safe-area-inset-right,0px)+1rem)] sm:pl-[calc(env(safe-area-inset-left,0px)+1.5rem)] sm:pr-[calc(env(safe-area-inset-right,0px)+1.5rem)] lg:pl-[calc(env(safe-area-inset-left,0px)+2rem)] lg:pr-[calc(env(safe-area-inset-right,0px)+2rem)]">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="cursor-pointer flex items-center gap-3 group">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s"
              alt="Buske Logistics logo"
              className="w-12 h-12 rounded-full object-cover shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-[#0F1F3D] tracking-tight">
                Buske Logistics
              </div>
              <div className="text-xs text-gray-500 -mt-1">
                Your Trusted Global Logistics Partner
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-[#2563EB]"
                    : "text-gray-600 hover:text-[#0F1F3D]"
                }`}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-8 left-0 right-0 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#38BDF8]"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {showInstall && (
              <button
                onClick={async () => {
                  if (!deferredPrompt) return;
                  deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  setShowInstall(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Install App
              </button>
            )}
            <Link
              to="/signin"
              className="px-5 py-2.5 font-medium text-[#0F1F3D] hover:text-[#2563EB] transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/signin"
              className="px-5 py-2.5 font-medium bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-gray-200 bg-white"
        >
          <div className="px-5 py-6 space-y-4 pl-[calc(env(safe-area-inset-left,0px)+1rem)] pr-[calc(env(safe-area-inset-right,0px)+1rem)]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 font-medium ${
                  isActive(link.path)
                    ? "text-[#2563EB]"
                    : "text-gray-600"
                }`}
                aria-current={isActive(link.path) ? 'page' : undefined}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-5 py-2.5 text-center font-medium text-[#0F1F3D] border-2 border-[#0F1F3D] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-5 py-2.5 text-center font-medium bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white rounded-xl"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
