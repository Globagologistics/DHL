import type { Checkpoint, ShipmentEvent, ShipmentWithCheckpoints } from '../../types/database';

export type TimelineEntry = {
  id: string;
  title: string;
  location: string | null;
  detail: string | null;
  at: string;
  tone: 'done' | 'current' | 'alert' | 'upcoming';
};

const alertKinds: ShipmentEvent['kind'][] = ['paused', 'stopped', 'cancelled', 'terminated'];

/** "New York, NY · Processed at origin facility" → title + location. */
function splitCheckpoint(checkpoint: Checkpoint) {
  const [place, ...rest] = checkpoint.location.split(' · ');
  return rest.length ? { title: rest.join(' · '), location: place } : { title: checkpoint.status === 'completed' ? 'Checkpoint completed' : 'Shipment at checkpoint', location: checkpoint.location };
}

/**
 * Customer-facing timeline: lifecycle events (published, started, paused…,
 * admin updates) merged with recorded checkpoints, newest first. Upcoming
 * checkpoints are returned separately.
 */
export function buildTimeline(shipment: ShipmentWithCheckpoints): { history: TimelineEntry[]; upcoming: TimelineEntry[] } {
  const events: TimelineEntry[] = (shipment.lifecycle_events || [])
    .filter(event => event.kind !== 'created')
    .map(event => ({ id: event.id, title: event.title, location: event.location || null, detail: event.detail || null, at: event.at, tone: alertKinds.includes(event.kind) ? 'alert' : 'done' }));
  const checkpoints = [...(shipment.checkpoints || [])].sort((a, b) => a.checkpoint_order - b.checkpoint_order);
  const recorded: TimelineEntry[] = checkpoints.filter(point => point.status !== 'pending').map(point => ({ id: point.id, ...splitCheckpoint(point), detail: null, at: point.created_at, tone: point.status === 'current' ? 'current' : 'done' }));
  const upcoming: TimelineEntry[] = checkpoints.filter(point => point.status === 'pending').map(point => ({ id: point.id, ...splitCheckpoint(point), detail: null, at: point.created_at, tone: 'upcoming' }));
  const history = [...events, ...recorded].sort((a, b) => b.at.localeCompare(a.at));
  // The newest entry is the shipment's current position unless it is an alert.
  if (history[0] && history[0].tone === 'done') history[0] = { ...history[0], tone: 'current' };
  return { history, upcoming };
}
