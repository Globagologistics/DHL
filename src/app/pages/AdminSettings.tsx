import { useEffect, useState } from 'react';
import { Activity, AppWindow, BellRing, Mail, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';
import type { ComponentType } from 'react';
import { AccountSection } from '../../features/settings/sections/AccountSection';
import { ApplicationSection } from '../../features/settings/sections/ApplicationSection';
import { DangerZoneSection } from '../../features/settings/sections/DangerZoneSection';
import { EmailSection } from '../../features/settings/sections/EmailSection';
import { IntegrationSection } from '../../features/settings/sections/IntegrationSection';
import { NotificationSection } from '../../features/settings/sections/NotificationSection';
import { WhatsAppSection } from '../../features/settings/sections/WhatsAppSection';
import { WhatsAppIcon } from '../../features/whatsapp/WhatsAppSupport';
import { settingsStoreMode } from '../../services/settings/settingsStore';

const sections: { id: string; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'account', label: 'Admin Account', icon: UserRound },
  { id: 'email', label: 'Email & SMTP', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { id: 'notifications', label: 'Notifications', icon: BellRing },
  { id: 'application', label: 'Application', icon: AppWindow },
  { id: 'integrations', label: 'Integration Status', icon: Activity },
  { id: 'danger', label: 'Danger Zone', icon: TriangleAlert },
];

/**
 * Admin Settings. Saving here writes operational configuration through the
 * settings services; it never edits source files, .env files or deployment
 * configuration, and credentials go only to the authenticated server endpoint.
 */
export default function AdminSettings() {
  const [active, setActive] = useState('account');
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-80px 0px -60% 0px' });
    sections.forEach(section => { const element = document.getElementById(section.id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);
  const developmentStore = settingsStoreMode() === 'development';
  return <div className="dhl-admin-settings-page">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">ADMINISTRATION</span><h1>Settings</h1><p>Operational configuration for your DHL Express workspace.</p></div></div>
    <div className="dhl-settings-assurance"><ShieldCheck size={18} /><span>Passwords and app passwords are write-only: after saving they are never shown again. Database and deployment keys are managed outside this dashboard.</span></div>
    {developmentStore && <p className="dhl-admin-banner" role="status">Development settings store is active. Values are saved in this browser only and email credentials are never stored.</p>}
    <div className="dhl-settings-layout">
      <nav className="dhl-settings-nav" aria-label="Settings sections">
        {sections.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className={`${active === id ? 'active' : ''}${id === 'danger' ? ' danger' : ''}`} aria-current={active === id ? 'true' : undefined} onClick={event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActive(id); }}><Icon size={16} /><span>{label}</span></a>)}
      </nav>
      <div className="dhl-settings-sections">
        <AccountSection />
        <EmailSection />
        <WhatsAppSection />
        <NotificationSection />
        <ApplicationSection />
        <IntegrationSection />
        <DangerZoneSection />
      </div>
    </div>
  </div>;
}
