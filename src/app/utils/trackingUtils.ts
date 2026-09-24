import { Checkpoint } from "../contexts/AdminContext";

export interface EnhancedCheckpoint extends Checkpoint {
  status: 'completed' | 'current' | 'pending';
  estimatedPassTime: Date;
  passedAgo?: string;
  timeUntilPass?: string;
}

export function calculateCheckpointTimes(
  checkpoints: Checkpoint[],
  departureTime: string,
  estimatedArrival: string,
  isFlightShipment: boolean
): EnhancedCheckpoint[] {
  if (!departureTime || !estimatedArrival || checkpoints.length === 0) {
    return checkpoints.map((c, idx) => ({
      ...c,
      status: 'pending' as const,
      estimatedPassTime: new Date(),
    }));
  }

  const departure = new Date(departureTime);
  const arrival = new Date(estimatedArrival);
  const now = new Date();

  // For flight shipments, only show 2 locations (takeoff and landing)
  const displayCheckpoints = isFlightShipment
    ? [checkpoints[0], checkpoints[checkpoints.length - 1]]
    : checkpoints;

  const totalDurationMs = arrival.getTime() - departure.getTime();
  const segmentDuration = totalDurationMs / (displayCheckpoints.length + 1);

  return displayCheckpoints.map((checkpoint, idx) => {
    // Calculate when this checkpoint should be reached
    const estimatedPassTime = new Date(
      departure.getTime() + segmentDuration * (idx + 1)
    );

    // Determine status based on current time
    let status: 'completed' | 'current' | 'pending' = 'pending';
    if (now > estimatedPassTime) {
      status = 'completed';
    } else if (
      now > new Date(estimatedPassTime.getTime() - segmentDuration * 0.1) &&
      now <= estimatedPassTime
    ) {
      status = 'current';
    }

    // Calculate time ago or time until pass
    const timeDiff = now.getTime() - estimatedPassTime.getTime();
    let passedAgo = '';
    let timeUntilPass = '';

    if (status === 'completed') {
      passedAgo = formatTimeAgo(Math.abs(timeDiff));
    } else if (status === 'pending') {
      timeUntilPass = formatTimeUntil(Math.abs(timeDiff));
    }

    return {
      ...checkpoint,
      status,
      estimatedPassTime,
      passedAgo,
      timeUntilPass,
    };
  });
}

function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatTimeUntil(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `in ${seconds}s`;
  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  return `in ${days}d`;
}

export function calculateProgressPercentage(
  departureTime: string,
  estimatedArrival: string
): number {
  if (!departureTime || !estimatedArrival) return 0;

  const departure = new Date(departureTime);
  const arrival = new Date(estimatedArrival);
  const now = new Date();

  const totalDuration = arrival.getTime() - departure.getTime();
  const elapsed = now.getTime() - departure.getTime();

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  return Math.round((elapsed / totalDuration) * 100);
}

export function isFlightShipment(transportMode: string): boolean {
  return transportMode === 'Air Freight' || transportMode === 'Air & Express';
}
