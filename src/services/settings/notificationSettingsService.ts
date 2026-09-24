import { readSettings, writeSettings } from './settingsStore';
import type { NotificationCategory, NotificationPreferences } from '../../features/settings/types';

export const notificationCategoryLabels: Record<NotificationCategory, { label: string; description: string }> = {
  shipmentCreated: { label: 'Shipment Created', description: 'Sender and recipient are told a shipment was registered.' },
  shipmentUpdated: { label: 'Shipment Updated', description: 'Status changes, holds, releases and delays.' },
  inTransit: { label: 'In Transit', description: 'The shipment leaves origin and moves through the network.' },
  outForDelivery: { label: 'Out for Delivery', description: 'The shipment is with the courier for final delivery.' },
  delivered: { label: 'Delivered', description: 'Delivery confirmation to sender and recipient.' },
  shipmentRequestSubmitted: { label: 'Shipment Request Submitted', description: 'The administrator is told a public request needs review.' },
  customerSupportMessage: { label: 'Customer Support Message', description: 'Email alerts for new chat messages.' },
  adminNotification: { label: 'Admin Notification', description: 'Operational alerts sent to the admin notification email.' },
};

export const getNotificationPreferences = (options?: { fresh?: boolean }) => readSettings('notification_preferences', options);

export const saveNotificationPreferences = (value: NotificationPreferences) => writeSettings('notification_preferences', value);
