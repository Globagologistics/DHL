export type SupportAgentId = 'support_emily' | 'support_lauren' | 'support_sophia';

export type SupportAgent = {
  id: SupportAgentId;
  name: string;
  role: string;
  region: string;
  timezone: string;
  avatar: string;
};

/** Customer-facing presentation identities. They never replace the authenticated admin user. */
export const supportAgents: readonly SupportAgent[] = [
  { id: 'support_emily', name: 'Emily Carter', role: 'Senior Shipment Support Specialist', region: 'United States', timezone: 'America/New_York', avatar: '/support-agents/emily-carter.png' },
  { id: 'support_lauren', name: 'Lauren Mitchell', role: 'Customer Care Specialist', region: 'United States', timezone: 'America/Chicago', avatar: '/support-agents/lauren-mitchell.png' },
  { id: 'support_sophia', name: 'Sophia Bennett', role: 'Delivery Support Specialist', region: 'United States', timezone: 'America/Los_Angeles', avatar: '/support-agents/sophia-bennett.png' },
];

const operationalTimeZone = 'America/New_York';

export function activeSupportAgent(now = new Date()): SupportAgent {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: operationalTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value || 0);
  const year = value('year');
  const month = value('month');
  const day = value('day');
  const ordinal = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
  return supportAgents[ordinal % supportAgents.length];
}

export function supportAgentFor(id?: string | null): SupportAgent | undefined {
  return supportAgents.find(agent => agent.id === id);
}

export const supportOperationsTimeZone = operationalTimeZone;
