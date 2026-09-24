export type JourneyStatus =
  | "processing"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "customs_processing"
  | "on_hold"
  | "delayed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "paused"
  | "stopped"
  | "terminated";

export interface ShipmentJourneyInput {
  status?: string | null;
  countdown_duration?: number | null;
  countdown_start_time?: string | null;
  estimated_delivery_at?: string | null;
  created_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  pause_timestamp?: string | null;
  stop_timestamp?: string | null;
  terminate_timestamp?: string | null;
  paused?: boolean | null;
  stopped?: boolean | null;
  terminated?: boolean | null;
}

export interface ShipmentJourneyState {
  progress: number;
  status: JourneyStatus;
  isMoving: boolean;
  isFrozen: boolean;
}

const ACTIVE_STATUSES = new Set<JourneyStatus>([
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delayed",
]);

const FROZEN_STATUSES = new Set<JourneyStatus>([
  "processing",
  "pickup_scheduled",
  "customs_processing",
  "on_hold",
  "paused",
  "stopped",
  "cancelled",
  "returned",
  "terminated",
]);

const VALID_STATUSES = new Set<JourneyStatus>([
  "processing",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "customs_processing",
  "on_hold",
  "delayed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "paused",
  "stopped",
  "terminated",
]);

function asTime(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getJourneyStatus(shipment: ShipmentJourneyInput): JourneyStatus {
  if (shipment.terminated) return "terminated";
  if (shipment.stopped) return "on_hold";
  if (shipment.paused) return "paused";

  const normalized = String(shipment.status || "in_transit")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return VALID_STATUSES.has(normalized as JourneyStatus)
    ? (normalized as JourneyStatus)
    : "in_transit";
}

export function formatJourneyStatus(status: JourneyStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Calculates the journey position from persisted shipment timing. Countdown
 * fields are the established source of truth; ETA is a fallback only for older
 * records that have no countdown duration.
 */
export function getShipmentJourneyState(
  shipment: ShipmentJourneyInput,
  now = Date.now(),
): ShipmentJourneyState {
  const status = getJourneyStatus(shipment);

  if (status === "delivered") {
    return { progress: 100, status, isMoving: false, isFrozen: true };
  }

  const start = asTime(shipment.countdown_start_time)
    ?? asTime(shipment.published_at)
    ?? asTime(shipment.created_at);
  const countdownDuration = Number(shipment.countdown_duration || 0) * 1000;
  const eta = asTime(shipment.estimated_delivery_at);
  // A delayed shipment's updated ETA is the authoritative revised timeline.
  // Other lifecycle states retain the established countdown duration.
  const totalDuration = status === "delayed" && start && eta && eta > start
    ? eta - start
    : countdownDuration > 0
    ? countdownDuration
    : start && eta && eta > start
    ? eta - start
    : 0;

  if (!start || totalDuration <= 0) {
    return {
      progress: 0,
      status,
      isMoving: ACTIVE_STATUSES.has(status),
      isFrozen: FROZEN_STATUSES.has(status),
    };
  }

  const explicitFreezeAt = shipment.terminated
    ? asTime(shipment.terminate_timestamp)
    : shipment.stopped
    ? asTime(shipment.stop_timestamp)
    : shipment.paused
    ? asTime(shipment.pause_timestamp)
    : null;
  // Status-only stops have no dedicated timestamp in the existing schema.
  // updated_at is the authoritative timestamp for that status transition.
  const statusFreezeAt = FROZEN_STATUSES.has(status)
    ? asTime(shipment.updated_at)
    : null;
  const effectiveNow = explicitFreezeAt ?? statusFreezeAt ?? now;

  return {
    progress: clampProgress(((effectiveNow - start) / totalDuration) * 100),
    status,
    isMoving: ACTIVE_STATUSES.has(status),
    isFrozen: FROZEN_STATUSES.has(status),
  };
}
