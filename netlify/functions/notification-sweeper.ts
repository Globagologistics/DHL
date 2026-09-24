import type { Config, Handler } from '@netlify/functions';
import { processNotificationEvents } from './dispatch-notifications.js';

// Recovery only: normal notification events are dispatched immediately by the
// authenticated database webhook. This schedule claims pending, failed, and
// stale events left behind by a missed callback or failed delivery.
export const handler: Handler = async () => processNotificationEvents();

export const config: Config = { schedule: '*/5 * * * *' };
