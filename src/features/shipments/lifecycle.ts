import type { LifecycleState, Shipment, ShipmentEvent } from '../../types/database';
import { getShipmentJourneyState } from '../../app/utils/shipmentJourney';

/**
 * The one place that defines shipment lifecycle rules. The database RPCs in
 * migration 20260926000000 implement the same transitions server-side; the
 * development data store uses applyTransition() below.
 *
 *   created ─▶ SCHEDULED ─publish─▶ AWAITING_TAKEOFF ─start─▶ IN_TRANSIT ─deliver─▶ DELIVERED
 *                  │                     │                      │   ▲
 *                cancel                cancel              pause │   │ resume / restart
 *                  ▼                     ▼                 stop  ▼   │
 *              CANCELLED             CANCELLED            PAUSED / STOPPED ─terminate─▶ TERMINATED
 */

export type LifecycleAction = 'publish' | 'start' | 'pause' | 'resume' | 'stop' | 'restart' | 'deliver' | 'cancel' | 'terminate';

export const lifecycleLabels: Record<LifecycleState, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  scheduled: 'Scheduled',
  awaiting_takeoff: 'Awaiting Takeoff',
  in_transit: 'In Transit',
  paused: 'Paused',
  stopped: 'Stopped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  terminated: 'Terminated',
};

export type LifecycleTone = 'neutral' | 'pending' | 'transit' | 'alert' | 'delivered';
export const lifecycleTone: Record<LifecycleState, LifecycleTone> = {
  draft: 'neutral', pending_review: 'pending', scheduled: 'pending', awaiting_takeoff: 'pending',
  in_transit: 'transit', paused: 'alert', stopped: 'alert', delivered: 'delivered', cancelled: 'alert', terminated: 'alert',
};

export const ACTIVE_STATES: LifecycleState[] = ['in_transit', 'paused', 'stopped'];
export const FINAL_STATES: LifecycleState[] = ['delivered', 'cancelled', 'terminated'];
export const INTERRUPTION_STATES: LifecycleState[] = ['paused', 'stopped', 'cancelled', 'terminated'];

type ActionRule = {
  from: LifecycleState[];
  to: LifecycleState;
  label: string;
  description: string;
  reason: 'none' | 'required';
  /** Typed confirmation for irreversible actions. */
  confirmText?: string;
  tone: 'primary' | 'neutral' | 'danger';
};

export const actionRules: Record<LifecycleAction, ActionRule> = {
  publish: { from: ['draft', 'scheduled'], to: 'awaiting_takeoff', label: 'Publish Shipment', description: 'Assigns the 12-digit tracking number and makes the shipment trackable. Movement does not start yet.', reason: 'none', tone: 'primary' },
  start: { from: ['awaiting_takeoff'], to: 'in_transit', label: 'Start Shipment', description: 'Records the start time now and begins the journey toward the delivery estimate.', reason: 'none', tone: 'primary' },
  pause: { from: ['in_transit'], to: 'paused', label: 'Pause Shipment', description: 'Temporarily holds the shipment. Customers see the reason.', reason: 'required', tone: 'neutral' },
  resume: { from: ['paused'], to: 'in_transit', label: 'Resume Shipment', description: 'Continues the journey. Paused time is not counted.', reason: 'none', tone: 'primary' },
  stop: { from: ['in_transit', 'paused'], to: 'stopped', label: 'Stop Shipment', description: 'A stronger hold than pause: movement stops until you restart it. Customers see the reason.', reason: 'required', tone: 'danger' },
  restart: { from: ['stopped'], to: 'in_transit', label: 'Restart Shipment', description: 'Continues a stopped shipment. Stopped time is not counted.', reason: 'none', tone: 'primary' },
  deliver: { from: ['in_transit'], to: 'delivered', label: 'Mark Delivered', description: 'Completes the shipment and notifies the customer.', reason: 'none', tone: 'primary' },
  cancel: { from: ['draft', 'scheduled', 'awaiting_takeoff'], to: 'cancelled', label: 'Cancel Shipment', description: 'Cancels the shipment before it starts moving.', reason: 'required', tone: 'danger' },
  terminate: { from: ['in_transit', 'paused', 'stopped'], to: 'terminated', label: 'Terminate Shipment', description: 'Final and irreversible. The shipment ends here.', reason: 'required', confirmText: 'TERMINATE', tone: 'danger' },
};

export const PAUSE_REASONS = ['Weather delay', 'Customs inspection', 'Operational delay', 'Customer request', 'Other'];

export const allowedActions = (state: LifecycleState): LifecycleAction[] =>
  (Object.keys(actionRules) as LifecycleAction[]).filter(action => actionRules[action].from.includes(state));

export const canTransition = (state: LifecycleState, action: LifecycleAction) => actionRules[action].from.includes(state);

/** Deleting keeps the row for audit; allowed only when nothing is moving. */
export const canSoftDelete = (state: LifecycleState) => !ACTIVE_STATES.includes(state);

/** Lifecycle for rows created before lifecycle_state existed. */
export function deriveLifecycleState(shipment: Partial<Shipment>): LifecycleState {
  if (shipment.lifecycle_state) return shipment.lifecycle_state;
  if (shipment.terminated) return 'terminated';
  if (shipment.status === 'cancelled') return 'cancelled';
  if (shipment.status === 'delivered') return 'delivered';
  if (shipment.stopped || shipment.status === 'stopped' || shipment.status === 'on_hold') return 'stopped';
  if (shipment.paused || shipment.status === 'paused') return 'paused';
  if (shipment.is_published === false) return 'scheduled';
  if (shipment.status === 'processing' || shipment.status === 'pickup_scheduled') return 'awaiting_takeoff';
  return 'in_transit';
}

export const lifecycleLabelFor = (shipment: Partial<Shipment>) => lifecycleLabels[deriveLifecycleState(shipment)];

/** Journey progress 0–100: nothing moves before Start, delivered is complete. */
export function lifecycleProgress(shipment: Shipment, now = Date.now()): number {
  const state = deriveLifecycleState(shipment);
  if (state === 'delivered') return 100;
  if (['draft', 'pending_review', 'scheduled', 'awaiting_takeoff', 'cancelled'].includes(state)) return 0;
  return getShipmentJourneyState(shipment, now).progress;
}

/** Progress shown to customers: the admin's route progress when set, otherwise the journey timeline. */
export function displayProgress(shipment: Shipment, now = Date.now()): number {
  const state = deriveLifecycleState(shipment);
  if (state === 'delivered') return 100;
  if (shipment.route_progress != null && !['draft', 'pending_review', 'scheduled', 'cancelled'].includes(state)) return Math.min(100, Math.max(0, shipment.route_progress));
  return lifecycleProgress(shipment, now);
}

/** Customer-facing interruption summary, or null when the shipment is not interrupted. */
export function interruptionFor(shipment: Shipment): { state: LifecycleState; title: string; reason: string | null; at: string | null } | null {
  const state = deriveLifecycleState(shipment);
  if (!INTERRUPTION_STATES.includes(state)) return null;
  const titles: Partial<Record<LifecycleState, string>> = { paused: 'Shipment temporarily paused', stopped: 'Shipment stopped', cancelled: 'Shipment cancelled', terminated: 'Shipment terminated' };
  const at = state === 'paused' ? shipment.pause_timestamp : state === 'stopped' ? shipment.stop_timestamp : state === 'cancelled' ? shipment.cancelled_at : shipment.terminate_timestamp;
  return { state, title: titles[state] || lifecycleLabels[state], reason: shipment.customer_status_reason || shipment.stop_reason || null, at: at || shipment.updated_at || null };
}

const eventTitles: Record<LifecycleAction, (shipment: Shipment) => string> = {
  publish: () => 'Shipment information received',
  start: shipment => /air/i.test(shipment.transportation) ? 'Shipment departed origin airport' : /sea|ocean/i.test(shipment.transportation) ? 'Shipment departed origin port' : 'Shipment departed origin facility',
  pause: () => 'Shipment temporarily paused',
  resume: () => 'Shipment resumed',
  stop: () => 'Shipment stopped',
  restart: () => 'Shipment restarted',
  deliver: () => 'Shipment delivered',
  cancel: () => 'Shipment cancelled',
  terminate: () => 'Shipment terminated',
};
const eventKinds: Record<LifecycleAction, ShipmentEvent['kind']> = { publish: 'published', start: 'started', pause: 'paused', resume: 'resumed', stop: 'stopped', restart: 'restarted', deliver: 'delivered', cancel: 'cancelled', terminate: 'terminated' };

const newEventId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function makeEvent(kind: ShipmentEvent['kind'], title: string, at: string, detail?: string | null, location?: string | null): ShipmentEvent {
  return { id: newEventId(), kind, title, at, detail: detail || null, location: location || null };
}

/**
 * Pure transition used by the development data store. Mirrors the SQL RPCs:
 * sets lifecycle_state plus the legacy columns (status, flags, reasons,
 * timestamps) that tracking, journey progress and email notifications read.
 */
export function applyTransition(shipment: Shipment, action: LifecycleAction, reason: string, now: Date, trackingNumber?: string): Shipment {
  const state = deriveLifecycleState(shipment);
  const rule = actionRules[action];
  if (!rule.from.includes(state)) throw new Error(`${rule.label} is not available while the shipment is ${lifecycleLabels[state].toLowerCase()}.`);
  const cleanReason = reason.trim();
  if (rule.reason === 'required' && !cleanReason) throw new Error('Enter a reason. Customers will see it.');
  const at = now.toISOString();
  const next: Shipment = { ...shipment, lifecycle_state: rule.to, updated_at: at };
  const shift = (since?: string | null) => {
    // Held time does not count toward the journey.
    if (!since || !next.countdown_start_time) return;
    const held = now.getTime() - new Date(since).getTime();
    next.countdown_start_time = new Date(new Date(next.countdown_start_time).getTime() + Math.max(0, held)).toISOString();
  };
  switch (action) {
    case 'publish':
      next.tracking_number = shipment.tracking_number || trackingNumber || null;
      next.is_published = true; next.published_at = at; next.status = 'pickup_scheduled';
      break;
    case 'start': {
      const eta = shipment.estimated_delivery_at ? new Date(shipment.estimated_delivery_at).getTime() : 0;
      next.started_at = at; next.countdown_start_time = at; next.status = 'in_transit';
      next.countdown_duration = Math.max(3600, Math.round((eta - now.getTime()) / 1000)) || 86400;
      break;
    }
    case 'pause':
      next.paused = true; next.pause_timestamp = at; next.customer_status_reason = cleanReason;
      break;
    case 'resume':
      shift(shipment.pause_timestamp);
      next.paused = false; next.pause_timestamp = null; next.customer_status_reason = null;
      break;
    case 'stop':
      if (shipment.paused) { shift(shipment.pause_timestamp); next.paused = false; next.pause_timestamp = null; }
      next.stopped = true; next.stop_timestamp = at; next.stop_reason = cleanReason; next.customer_status_reason = cleanReason;
      break;
    case 'restart':
      shift(shipment.stop_timestamp);
      next.stopped = false; next.stop_timestamp = null; next.stop_reason = null; next.customer_status_reason = null;
      break;
    case 'deliver':
      next.status = 'delivered'; next.delivered_at = at;
      break;
    case 'cancel':
      next.status = 'cancelled'; next.cancelled_at = at; next.customer_status_reason = cleanReason;
      break;
    case 'terminate':
      next.terminated = true; next.terminate_timestamp = at; next.stopped = true; next.customer_status_reason = cleanReason;
      break;
  }
  next.lifecycle_events = [...(shipment.lifecycle_events || []), makeEvent(eventKinds[action], eventTitles[action](shipment), at, cleanReason || null)];
  return next;
}

/** Plain-language message for the WhatsApp "Send update" deep link. */
export function customerUpdateMessage(shipment: Shipment, action: LifecycleAction, reason?: string) {
  const ref = shipment.tracking_number || 'your shipment';
  const line: Record<LifecycleAction, string> = {
    publish: `Your shipment ${ref} has been registered with DHL Express and is awaiting takeoff.`,
    start: `Your shipment ${ref} is now on its way.`,
    pause: `Your shipment ${ref} is temporarily paused.`,
    resume: `Your shipment ${ref} is moving again.`,
    stop: `Your shipment ${ref} has been stopped.`,
    restart: `Your shipment ${ref} is moving again.`,
    deliver: `Your shipment ${ref} has been delivered.`,
    cancel: `Your shipment ${ref} has been cancelled.`,
    terminate: `Your shipment ${ref} has been terminated.`,
  };
  return `Hello ${shipment.receiver_name || ''}, ${line[action]}${reason ? ` Reason: ${reason}.` : ''} Track it any time with tracking number ${ref}.`.replace(/\s+/g, ' ').trim();
}
