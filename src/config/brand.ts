/** Public prototype presentation metadata. No credentials belong here. */
export const brandConfig = {
  appName: 'DHL Express',
  shortName: 'DHL',
  companyName: 'DHL Express',
  supportName: 'DHL Shipment Support',
  trackingLabel: 'Tracking number',
  shipmentLabel: 'Shipment',
  // Public browser metadata remains neutral; on-screen brand presentation is
  // intentionally isolated from the public deployment identity.
  pageTitle: 'Shipment Tracking Demo',
  metaDescription: 'Track your package seamlessly, follow delivery progress, and access shipment support from one place.',
  logo: '/dhl-concept-logo.svg',
  favicon: '/shipment-tracking-icon.svg',
  campaignImage: '/images/dhl-logistics-campaign.jpeg',
  cinematicLogo: '/dhl-cinematic-logo.svg',
  cinematicPortrait: {
    webp: '/images/dhl-cinematic-portrait.webp',
    fallback: '/images/dhl-cinematic-portrait.jpg',
  },
  cinematicLandscape: {
    webp: '/images/dhl-cinematic-landscape.webp',
    fallback: '/images/dhl-cinematic-landscape.jpg',
  },
  themeColor: '#FFCC00',
} as const;
