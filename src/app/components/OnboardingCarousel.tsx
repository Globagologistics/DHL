import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { cn } from "./ui/utils";

type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  accentColor: string;
};

export const onboardingData: OnboardingSlide[] = [
  {
    id: "global-network",
    title: "Real-Time Consignment Tracking.",
    description:
      "Track every shipment live with instant updates, alerts, and clear ETAs from pickup to delivery.",
    imageUrl:
      "https://www.dhl.com/discover/adobe/dynamicmedia/deliver/dm-aid--fb2074c7-45b1-4634-945b-cbf007e04a1c/desktop-image-1920x918.jpg?quality=82&preferwebp=true",
    accentColor: "bg-amber-400",
  },
  {
    id: "visibility-control",
    title: "Delivering Worldwide, Every Day.",
    description:
      "Ship and receive parcels across 105+ countries with customs-ready support and global coverage.",
    imageUrl:
      "https://www.airistaflow.com/wp-content/uploads/2024/10/AdobeStock_523184404-scaled.jpeg",
    accentColor: "bg-sky-400",
  },
  {
    id: "trusted-partner",
    title: "Door-to-Door, Done Right.",
    description:
      "End-to-end service from pickup to final destination with careful handling at every step.",
    imageUrl:
      "https://corlettexpress.com/storage/2021/01/What-the-World-Would-Be-Like-If-Distribution-Services-Didnt-Exist-2048x1024.webp",
    accentColor: "bg-emerald-400",
  },
  {
    id: "global-coverage",
    title: "Any Size Package, Any Route.",
    description:
      "From small parcels to oversized cargo, we handle every dimension and weight with care.",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1661963876857-0cff8745a6af?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accentColor: "bg-violet-400",
  },
  {
    id: "precision-ops",
    title: "Scale That Keeps You Moving.",
    description:
      "500+ warehouses and 6,500+ fleet vehicles keep deliveries fast, safe, and on schedule.",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1664297616681-81ae24954249?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accentColor: "bg-rose-400",
  },
  {
    id: "fast-track",
    title: "Trusted by Millions of Shippers.",
    description:
      "100M+ packages delivered with security, transparency, and on-time performance.",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1661454426308-e8b2958f7cf0?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accentColor: "bg-orange-400",
  },
];

export function OnboardingCarousel() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slidesCount = onboardingData.length;
  const navigate = useNavigate();

  useEffect(() => {
    if (slidesCount < 2) return;

    const interval = window.setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slidesCount);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slidesCount]);

  const currentSlide = onboardingData[currentSlideIndex] ?? onboardingData[0];

  if (!currentSlide) {
    return null;
  }

  return (
    <section className="relative isolate h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/* Layer 1: Background Images */}
      <div className="absolute inset-0">
        {onboardingData.map((slide, index) => {
          const isActive = index === currentSlideIndex;

          return (
            <div
              key={slide.id}
              aria-hidden="true"
              className="absolute inset-0 bg-center bg-cover"
              style={{
                backgroundImage: `url(${slide.imageUrl})`,
                opacity: isActive ? 1 : 0,
                transform: `scale(${isActive ? 1.05 : 1})`,
                transitionProperty: "opacity, transform",
                transitionDuration: "1000ms, 5000ms",
                transitionTimingFunction: "ease-in-out, ease-out",
                willChange: "opacity, transform",
              }}
            />
          );
        })}
      </div>

      {/* Layer 2: Protective Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.94)_38%,rgba(0,0,0,0.7)_62%,rgba(0,0,0,0.3)_80%,rgba(0,0,0,0)_92%)]" />

      {/* Layer 3: Content Wrapper */}
      <div className="relative z-20 flex h-[100dvh] w-full items-end">

        <div className="w-full px-6 pb-[calc(env(safe-area-inset-bottom,2.5rem)+1rem)] pt-20 md:pt-24">
          <div className="mx-auto w-full max-w-sm text-left md:mx-0 md:ml-16 md:max-w-md lg:ml-24">
            {/* Carousel Indicators */}
            <div className="flex items-center gap-2">
              {onboardingData.map((slide, index) => {
                const isActive = index === currentSlideIndex;

                return (
                  <span
                    key={slide.id}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-500",
                      isActive
                        ? "shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        : "bg-white/35",
                      isActive && slide.accentColor
                    )}
                  />
                );
              })}
            </div>

            {/* Typography */}
            <div className="mt-6 space-y-4">
              <h1 className="text-4xl font-black tracking-tighter leading-[1.1] md:text-5xl">
                {currentSlide.title}
              </h1>
              <p className="text-sm leading-relaxed text-slate-300 md:text-base">
                {currentSlide.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="w-full rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-black shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition hover:bg-white/90 active:scale-95 md:w-[240px]"
              >
                Learn More
              </button>
              <button
                type="button"
                onClick={() => navigate("/track-shipment")}
                className="group relative flex w-full items-center justify-center rounded-full bg-[#1E40AF] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.35)] transition hover:bg-[#1E3A8A] active:scale-95 md:w-[280px]"
              >
                <span
                  className={cn(
                    "absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-black transition-transform duration-300 group-hover:scale-110 group-active:scale-95",
                    currentSlide.accentColor ?? "bg-white/40"
                  )}
                >
                  <Package className="h-4 w-4" />
                </span>
                <span className="block px-10 text-center">Track Shipment Now</span>
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg text-white/40">
                  &raquo;&raquo;
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
