import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type WindowWithPrompt = Window & {
  deferredPWAInstallPrompt?: BeforeInstallPromptEvent;
};
import { Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [copyrightClicks, setCopyrightClicks] = useState(0);
  const logoSrc = `${import.meta.env.BASE_URL}buske-logo.jpeg`;

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      (window as WindowWithPrompt).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    const existing = (window as WindowWithPrompt).deferredPWAInstallPrompt;
    if (existing) {
      setDeferredPrompt(existing);
      setShowInstall(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  useEffect(() => {
    if (copyrightClicks === 5) {
      navigate("/signin?next=/admin");
      setCopyrightClicks(0);
    }
  }, [copyrightClicks, navigate]);

  const handleCopyrightClick = () => {
    setCopyrightClicks((c) => c + 1);
  };

  const solutions = [
    'Warehousing',
    'Sequencing',
    'E-Commerce',
    'Value-Added Services',
    'B2B Fulfillment',
    'B2C Fulfillment',
    '3PL Solutions',
  ];

  const industries = [
    'Food & Beverage',
    'Aerospace & Defense',
    'Automotive',
    'Healthcare',
    'Industrials',
    'Retailers and Distributors',
    'Industries Served',
  ];

  const handleInstallClick = async () => {
    const evt = deferredPrompt || (window as WindowWithPrompt).deferredPWAInstallPrompt;
    if (!evt) return;
    evt.prompt();
    await evt.userChoice;
    setShowInstall(false);
    try {
      delete (window as WindowWithPrompt).deferredPWAInstallPrompt;
    } catch (error) {
      console.warn("Failed to clear PWA install prompt", error);
    }
  };

  return (
    <>
    <footer className="bg-gradient-to-b from-[#0B1220] to-[#0F1F3D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwdV07RyApr_mVZOJRk3Rht0P98deLiSYB0Q&s"
                alt="Buske Logistics logo"
                className="w-12 h-12 rounded-full object-cover shadow-lg"
              />
              <div>
                <div className="font-bold text-xl">Buske Logistics</div>
                <div className="text-xs text-gray-400">
                  Your Trusted Global Logistics Partner
                </div>
              </div>
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed mb-3 font-medium">
              Your Trusted Global Partner
            </p>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Connecting the world through reliable, fast, and secure logistics solutions since 1998.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label={['Facebook','Twitter','LinkedIn','Instagram'][index]}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-2">
              {solutions.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Industries</h3>
            <ul className="space-y-2">
              {industries.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#38BDF8] mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  buskelogistics141@gmail.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm cursor-pointer select-none" onClick={handleCopyrightClick}>
              © {new Date().getFullYear()} Buske Logistics. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>

    {showInstall && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0B1220] p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img src={logoSrc} alt="Buske Logistics" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Install Buske Logistics</div>
              <div className="text-xs text-white/60">Get the full-screen tracking experience</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Install the app for faster access, push-style updates, and a distraction-free tracking view.
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleInstallClick}
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
            >
              Install App
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
 
