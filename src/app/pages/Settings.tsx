import { Link } from 'react-router-dom';
import { Bell, ChevronRight, Clock3, Globe2, Headphones, Info, Languages, MessageCircle, Package, Scale, ShieldCheck } from 'lucide-react';
import { PageHeading } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { recentTrackingNumber } from '../../services/trackingService';
import { DEMO_TRACKING_ID, isDemoShipmentEnabled } from '../../demo/demoShipment';
import { resetDemoChat } from '../../demo/demoChatStore';
import { resetDevData } from '../../demo/devDataStore';
import { useI18n } from '../../i18n';

export default function Settings() {
  const { t } = useI18n();
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <div className="dhl-container dhl-settings"><PageHeading title="Settings" backTo="/home"/><section className="dhl-settings-group" id="notifications"><h2>Notifications</h2><div className="dhl-card dhl-settings-list"><div className="dhl-settings-row"><Package size={18}/> Shipment Updates <span>Email on file</span></div><div className="dhl-settings-row"><Bell size={18}/> Delivery Alerts <span>Email on file</span></div><div className="dhl-settings-row"><MessageCircle size={18}/> Support Messages <span>In chat</span></div></div></section>
    <section className="dhl-settings-group"><h2>General</h2><div className="dhl-card dhl-settings-list"><div className="dhl-settings-row"><Languages size={18}/> Language <span>{language}</span></div><div className="dhl-settings-row"><Globe2 size={18}/> Region <span>{timezone}</span></div><div className="dhl-settings-row"><Clock3 size={18}/> Time Display <span>Local device time</span></div></div></section>
    <section className="dhl-settings-group"><h2>Support & information</h2><div className="dhl-card dhl-settings-list"><Link className="dhl-settings-row" to="/chat"><Headphones size={18}/> Help Center <span><ChevronRight size={17}/></span></Link><Link className="dhl-settings-row" to="/terms"><Scale size={18}/> {t('terms')} <span><ChevronRight size={17}/></span></Link><Link className="dhl-settings-row" to="/privacy"><ShieldCheck size={18}/> {t('privacy')} <span><ChevronRight size={17}/></span></Link><WhatsAppSupportButton trackingId={recentTrackingNumber()} className="dhl-settings-row dhl-settings-row-button"><WhatsAppIcon size={18}/> WhatsApp Support <span><ChevronRight size={17}/></span></WhatsAppSupportButton></div></section>
    {isDemoShipmentEnabled() && <section className="dhl-settings-group"><h2>Developer (development build only)</h2><div className="dhl-card dhl-settings-list dhl-dev-helper"><div className="dhl-settings-row"><Info size={18}/> Demo tracking <code>{DEMO_TRACKING_ID}</code><button type="button" onClick={() => { resetDevData(); resetDemoChat(); }}>Reset development data</button></div></div></section>}
    <section className="dhl-settings-group"><h2>{t('about')}</h2><div className="dhl-card dhl-settings-list"><Link className="dhl-settings-row" to="/about"><Info size={18}/> {t('about')} {brandConfig.pageTitle} <span><ChevronRight size={17}/></span></Link><Link className="dhl-settings-row" to="/terms"><Scale size={18}/> {t('terms')} <span><ChevronRight size={17}/></span></Link><Link className="dhl-settings-row" to="/privacy"><ShieldCheck size={18}/> {t('privacy')} <span><ChevronRight size={17}/></span></Link></div></section>
  </div>;
}
