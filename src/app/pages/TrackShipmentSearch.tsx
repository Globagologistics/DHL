import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useShipmentWithCheckpoints } from "../../hooks/useSupabase";

const backgroundImages = [
  "https://media.istockphoto.com/id/2157040201/photo/truck-carrying-forty-foot-container-leaving-port-terminal-with-ship-and-quay-crane-on-the.jpg?s=612x612&w=0&k=20&c=D4UJJ09jrr-lkrP_6FvIAj6-2PosXIzg-iQ_HcxD0iQ=",
  "https://www.multimodalforwarding.com/global-network.jpeg",
  "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?cs=srgb&dl=pexels-tiger-lily-4483610.jpg&fm=jpg",
];

export default function TrackShipmentSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [bgIndex, setBgIndex] = useState(0);
  const [lookupId, setLookupId] = useState("");
  const { shipment: matchedShipment, loading: lookupLoading } = useShipmentWithCheckpoints(lookupId);

  useEffect(() => {
    if (backgroundImages.length < 2) return;
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      navigate(`/track/${encodeURIComponent(id)}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Check the entered ID after the user pauses typing. A matching shipment
  // opens directly, so customers do not need to press the Track button.
  useEffect(() => {
    const value = trackingId.trim();
    if (!value) {
      setLookupId("");
      return;
    }
    const timer = window.setTimeout(() => setLookupId(value), 500);
    return () => window.clearTimeout(timer);
  }, [trackingId]);

  useEffect(() => {
    if (!lookupId || lookupLoading || !matchedShipment) return;
    navigate(`/track/${encodeURIComponent(matchedShipment.id)}`, { replace: true });
  }, [lookupId, lookupLoading, matchedShipment, navigate]);

  const handleTrack = (event: React.FormEvent) => {
    event.preventDefault();
    const value = trackingId.trim();
    if (!value) return;
    navigate(`/track/${encodeURIComponent(value)}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1220]">
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => {
          const isActive = index === bgIndex;
          return (
            <div
              key={image}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${image})`,
                opacity: isActive ? 1 : 0,
                transform: `scale(${isActive ? 1.06 : 1})`,
                transition: "opacity 1200ms ease-in-out, transform 8000ms ease-out",
                willChange: "opacity, transform",
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.92)_40%,rgba(0,0,0,0.6)_65%,rgba(0,0,0,0.25)_82%,rgba(0,0,0,0)_95%)]" />

      <div className="relative z-10 min-h-screen">
        <div className="min-h-screen flex items-center">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-[env(safe-area-inset-bottom,2.5rem)] pt-[env(safe-area-inset-top,1.5rem)] text-white">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
              >
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3">
                  Track Your Shipment
                </h1>
                <p className="text-lg md:text-xl text-slate-200">
                  Real-time tracking across the globe
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <form onSubmit={handleTrack} className="relative">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-2xl">
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="Enter Tracking ID (e.g. GG-2026-001)"
                        className="w-full sm:flex-1 rounded-xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] sm:px-6 sm:py-4"
                      />
                      <button
                        type="submit"
                        className="w-full sm:w-auto rounded-xl bg-[#2563EB] px-4 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_18px_45px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 sm:px-8 sm:py-4"
                      >
                        <Search className="w-5 h-5" />
                        Track
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
