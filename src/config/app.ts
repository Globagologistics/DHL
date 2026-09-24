import { brandConfig } from './brand';

export const appConfig = {
  brand: brandConfig,
  routes: {
    welcome: '/',
    home: '/home',
    tracking: '/track',
    support: '/chat',
    send: '/send-shipment',
    settings: '/settings',
    locations: '/locations',
  },
} as const;
