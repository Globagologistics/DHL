import React, { useEffect, useState } from "react";
import { ChatThread } from "../components/chat/ChatThread";
import { ensureChatThread } from "../../hooks/useChat";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function UserChat() {
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [activeThread, setActiveThread] = useState<{ id: string; trackingId: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const refreshAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) {
        setIsAuthenticated(Boolean(data.user));
        setAuthLoading(false);
      }
    };
    void refreshAuth();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const handleUnlock = async () => {
    if (!isAuthenticated) {
      navigate("/signin?next=/chat");
      return;
    }
    const value = trackingIdInput.trim();
    if (!value) return;

    setOpening(true);
    setValidationError(null);
    const thread = await ensureChatThread(value);
    setOpening(false);

    if (!thread) {
      setActiveThread(null);
      setValidationError("Tracking ID not found or you are not authorized to access this conversation.");
      return;
    }

    setActiveThread({ id: thread.id, trackingId: value });
    setAlertNotice("Tracking ID verified");
    window.setTimeout(() => setAlertNotice(null), 2000);
  };

  return (
    <div className="relative min-h-screen h-[100svh] w-full overflow-hidden bg-[#0B1220] text-white">
      <div className="absolute inset-0 bg-[url('https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg')] bg-cover bg-center opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(3,7,18,0.98)_0%,rgba(3,7,18,0.9)_45%,rgba(3,7,18,0.5)_70%,rgba(3,7,18,0)_90%)]" />

      <div className="relative z-10 flex h-full w-full flex-col">
        {!activeThread ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-2xl">
              <h1 className="text-3xl font-black tracking-tighter">
                {isAuthenticated ? "Enter Your Tracking ID" : "Sign in to access chat"}
              </h1>
              <p className="mt-3 text-sm text-white/70">
                {isAuthenticated
                  ? "Access live shipment updates, delivery status, and real-time support."
                  : "Private shipment messages are available only to authenticated shipment participants."}
              </p>
              {isAuthenticated && <input
                value={trackingIdInput}
                onChange={(event) => setTrackingIdInput(event.target.value)}
                placeholder="e.g. TRK-2026-0042"
                className="mt-6 h-12 w-full rounded-full border border-white/20 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />}
              {validationError && (
                <div className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                  {validationError}
                </div>
              )}
              <button
                type="button"
                onClick={handleUnlock}
                className="mt-6 w-full rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={authLoading || opening}
              >
                {authLoading
                  ? "Checking account..."
                  : !isAuthenticated
                    ? "Sign In"
                    : opening
                      ? "Verifying Tracking ID..."
                  : "Open Tracking Chat"}
              </button>
            </div>
          </div>
        ) : (
          <ChatThread
            trackingId={activeThread.trackingId}
            threadId={activeThread.id}
            role="user"
            title="Shipment Command Line"
            subtitle="Live tracking support"
            accentClassName="bg-[#1E40AF]"
            alertNotice={alertNotice}
          />
        )}
      </div>
    </div>
  );
}
