import "./ShipmentProgressBar.css";
import type { CSSProperties } from "react";
import { formatJourneyStatus, getJourneyStatus } from "../utils/shipmentJourney";

type ProgressCheckpoint = {
  positionPercent?: number;
  status?: "pending" | "current" | "completed" | "stopped";
};

interface ShipmentProgressBarProps {
  progress: number;
  transportMode: string;
  checkpoints?: ProgressCheckpoint[];
  status?: string;
  vehiclesCount?: number;
  isVisuallyPaused?: boolean;
  origin?: string;
  destination?: string;
}

type TransportType = "land" | "air" | "sea";

function getTransportType(mode: string): TransportType {
  const normalized = mode.toLowerCase();
  if (normalized.includes("air") || normalized.includes("flight")) return "air";
  if (/(sea|ship|ocean|maritime)/.test(normalized)) return "sea";
  return "land";
}

function TruckVehicle() {
  return <svg viewBox="0 0 130 72" aria-hidden="true"><ellipse cx="65" cy="57" rx="51" ry="8" fill="#07101c" opacity=".38"/><g className="shipment-journey__wheel"><circle cx="34" cy="17" r="7" fill="#0b1322"/><circle cx="34" cy="55" r="7" fill="#0b1322"/><path d="M34 11v12M28 17h12M34 49v12M28 55h12" stroke="#5a687a" strokeWidth="1.5"/></g><g className="shipment-journey__wheel"><circle cx="94" cy="17" r="7" fill="#0b1322"/><circle cx="94" cy="55" r="7" fill="#0b1322"/><path d="M94 11v12M88 17h12M94 49v12M88 55h12" stroke="#5a687a" strokeWidth="1.5"/></g><rect x="15" y="18" width="67" height="36" rx="4" fill="#f5f8fd"/><path d="M18 21h61v28H18z" fill="url(#cargo)"/><path d="M82 15h25c7 0 12 5 12 12v18c0 7-5 12-12 12H82z" fill="#f4574d"/><path d="M91 20h14c5 0 8 3 8 8v16c0 5-3 8-8 8H91z" fill="#172130"/><path d="M94 23h10c3 0 5 2 5 5v4H94z" fill="#365d7d"/><path d="M94 36h15v7H94z" fill="#263b52"/><path d="M84 18v34" stroke="#d73e38" strokeWidth="3"/><path d="M117 26l12-6v32l-12-6z" fill="#f5c85b" opacity=".24"/><rect x="116" y="25" width="4" height="7" rx="2" fill="#ffe072"/><rect x="116" y="40" width="4" height="7" rx="2" fill="#ffe072"/><defs><linearGradient id="cargo" x1="48" y1="18" x2="48" y2="54" gradientUnits="userSpaceOnUse"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#dbe4ef"/></linearGradient></defs></svg>;
}

function PlaneVehicle() {
  return <svg viewBox="0 0 130 72" aria-hidden="true"><path d="M9 40 61 29l45-24c5-3 10 3 6 7L83 39l32 13c4 2 2 8-3 8L76 46l-22 15-11-2 11-17-36 5z" fill="#f4f8fd"/><path d="M61 29 83 39l-7 7-22-4z" fill="#73b9df"/><path d="M19 40h38" stroke="#4a8fb9" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function ShipVehicle() {
  return <svg viewBox="0 0 130 72" aria-hidden="true"><path d="M14 46h103l-11 14H28z" fill="#f0f5f7"/><path d="M28 47h78l-5 8H33z" fill="#e8a83e"/><path d="M43 28h52v19H43z" fill="#285b7e"/><path d="M48 23h17v24H48z" fill="#eff5f7"/><path d="M51 27h10v7H51zM71 33h8v5h-8zM83 33h8v5h-8z" fill="#70c7e7"/><path d="M16 61c11-5 20 5 31 0s21 5 33 0 20 5 34 0" fill="none" stroke="#a9efff" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function Vehicle({ transport, stopped }: { transport: TransportType; stopped: boolean }) {
  const className = `shipment-journey__vehicle shipment-journey__vehicle--${transport}${stopped ? " shipment-journey__vehicle--stopped" : ""}`;
  return <div className={className}>{transport === "air" ? <PlaneVehicle /> : transport === "sea" ? <ShipVehicle /> : <TruckVehicle />}</div>;
}

function SceneAtmosphere({ transport }: { transport: TransportType }) {
  if (transport === "air") return <div className="shipment-journey__atmosphere" aria-hidden="true"><span className="shipment-journey__cloud shipment-journey__cloud--one"/><span className="shipment-journey__cloud shipment-journey__cloud--two"/></div>;
  if (transport === "sea") return <div className="shipment-journey__water" aria-hidden="true"/>;
  return <div className="shipment-journey__road" aria-hidden="true"/>;
}

/** A transport-agnostic scene whose position is controlled by persisted progress. */
export default function ShipmentProgressBar({
  progress,
  transportMode,
  checkpoints = [],
  status,
  isVisuallyPaused = false,
  origin = "Origin",
  destination = "Destination",
}: ShipmentProgressBarProps) {
  const transport = getTransportType(transportMode);
  const normalizedStatus = getJourneyStatus({ status });
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const isDelivered = normalizedStatus === "delivered";
  const isMoving = !isVisuallyPaused && !isDelivered && ["picked_up", "in_transit", "delayed", "out_for_delivery"].includes(normalizedStatus);
  const isStopped = !isMoving || normalizedStatus === "on_hold" || normalizedStatus === "cancelled" || normalizedStatus === "terminated";

  return <div className="space-y-3">
    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
      <span>Route Progress</span><span className="text-sm font-semibold tracking-normal text-white/90">{clampedProgress}%</span>
    </div>
    <div className={`shipment-journey shipment-journey--${transport}`} data-moving={isMoving} style={{ "--journey-progress": `${clampedProgress}%` } as CSSProperties} aria-label={`${formatJourneyStatus(normalizedStatus)}: ${clampedProgress}% of route complete`}>
      <div className="shipment-journey__scene"/>
      <SceneAtmosphere transport={transport}/>
      <div className="shipment-journey__route"><div className="shipment-journey__route-progress"/></div>
      <div className="shipment-journey__markers" aria-hidden="true">
        <div className="shipment-journey__marker shipment-journey__marker--origin"><span className="shipment-journey__marker-pin"/><span className="shipment-journey__marker-label">{origin}</span></div>
        <div className="shipment-journey__marker shipment-journey__marker--destination"><span className="shipment-journey__marker-pin"/><span className="shipment-journey__marker-label">{destination}</span></div>
      </div>
      {checkpoints.map((checkpoint, index) => <span key={index} className="sr-only">Checkpoint {index + 1}: {checkpoint.status || "pending"}, {checkpoint.positionPercent || 0}%</span>)}
      <div className="shipment-journey__vehicle-track"><Vehicle transport={transport} stopped={isStopped}/></div>
      <div className="shipment-journey__status"><span className="shipment-journey__status-dot"/>{formatJourneyStatus(normalizedStatus)}</div>
      {isDelivered && <div className="shipment-journey__completion">✓ Delivered</div>}
    </div>
    <p className="text-center text-xs text-white/60">{isDelivered ? "Delivery complete" : `${clampedProgress}% of the route completed`}</p>
  </div>;
}
