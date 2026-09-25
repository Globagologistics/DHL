/**
 * One wording for every tracking outcome. The Track page and Customer Support
 * read from here so a customer meets the same sentence wherever they arrive.
 */
export const trackingCopy = {
  incomplete: 'Tracking numbers contain 12 digits.',
  submittedIncomplete: 'Enter the complete 12-digit tracking number.',
  nonNumeric: 'Tracking numbers can contain numbers only.',
  searching: 'Searching for your shipment',
  found: 'Shipment found',
  notFound: {
    title: 'Shipment not found',
    message: 'We couldn’t find a shipment matching this tracking number.',
    note: 'Please confirm the 12-digit tracking number shown on your receipt or contact the sender for the correct shipment reference.',
    hint: 'Make sure there are no missing or incorrect digits.',
  },
  error: {
    title: 'We’re having trouble checking this shipment right now.',
    message: 'This is a connection problem on our side, not a problem with your tracking number. Please try again.',
  },
} as const;
