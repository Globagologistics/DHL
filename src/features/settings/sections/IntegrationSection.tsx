import { useCallback, useEffect, useState } from 'react';
import { Activity, Bell, Database, HardDrive, Mail, RefreshCw } from 'lucide-react';
import type { ComponentType } from 'react';
import { SettingsCard, StatePill } from '../SettingsPrimitives';
import type { IntegrationKey, IntegrationStatusItem } from '../types';
import { WhatsAppIcon } from '../../whatsapp/WhatsAppSupport';
import { getIntegrationStatus } from '../../../services/settings/integrationSettingsService';

const icons: Record<IntegrationKey, ComponentType<{ size?: number }>> = { database: Database, email: Mail, whatsapp: WhatsAppIcon, notifications: Bell, storage: HardDrive };

export function IntegrationSection() {
  const [items, setItems] = useState<IntegrationStatusItem[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setItems(await getIntegrationStatus());
    setCheckedAt(new Date());
    setLoading(false);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <SettingsCard id="integrations" icon={Activity} title="Integration Status" description="Live checks of each connected service. No keys or secret values are shown." badge={<button type="button" className="dhl-admin-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? 'dhl-spin' : ''} />{loading ? 'Checking…' : 'Refresh'}</button>}>
    <div className="dhl-settings-integrations" aria-busy={loading}>
      {(items ?? (['database', 'email', 'whatsapp', 'notifications', 'storage'] as IntegrationKey[]).map(key => ({ key, label: key[0].toUpperCase() + key.slice(1), state: 'not_configured' as const, detail: 'Checking…' }))).map(item => {
        const Icon = icons[item.key];
        return <article key={item.key} className={`state-${item.state}`}><div><span className="dhl-settings-integration-icon"><Icon size={18} /></span><strong>{item.label}</strong>{items ? <StatePill state={item.state} /> : <span className="dhl-settings-pill neutral">Checking</span>}</div><p>{item.detail}</p></article>;
      })}
    </div>
    {checkedAt && <p className="dhl-settings-hint">Last checked {checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>}
  </SettingsCard>;
}
