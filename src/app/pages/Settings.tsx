import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight, Clock3, Globe2, Headphones, Info, Languages, MessageCircle, Package } from 'lucide-react';
import { PageHeading } from '../components/customer/CustomerShell';
import { brandConfig } from '../../config/brand';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../features/whatsapp/WhatsAppSupport';
import { recentTrackingNumber } from '../../services/trackingService';
import { DEMO_TRACKING_ID, isDemoShipmentEnabled } from '../../demo/demoShipment';
import { resetDemoChat } from '../../demo/demoChatStore';
import { AdminContext } from '../contexts/AdminContext';

export default function Settings() {
  const { isAdmin } = useContext(AdminContext);
  const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <div className="dhl-container dhl-settings"><PageHeading title="Settings" backTo="/home"/><section className="dhl-settings-group" id="notifications"><h2>Notifications</h2><div className="dhl-card dhl-settings-list"><div className="dhl-settings-row"><Package size={18}/> Shipment Updates <span>Email on file</span></div><div className="dhl-settings-row"><Bell size={18}/> Delivery Alerts <span>Email on file</span></div><div className="dhl-settings-row"><MessageCircle size={18}/> Support Messages <span>In chat</span></div></div></section>
    <section className="dhl-settings-group"><h2>General</h2><div className="dhl-card dhl-settings-list"><div className="dhl-settings-row"><Languages size={18}/> Language <span>{language}</span></div><div className="dhl-settings-row"><Globe2 size={18}/> Region <span>{timezone}</span></div><div className="dhl-settings-row"><Clock3 size={18}/> Time Display <span>Local device time</span></div></div></section>
    <section className="dhl-settings-group"><h2>Support & information</h2><div className="dhl-card dhl-settings-list"><Link className="dhl-settings-row" to="/chat"><Headphones size={18}/> Help Center <span><ChevronRight size={17}/></span></Link><div className="dhl-settings-row"><Info size={18}/> Privacy and Terms <span>Not available in this concept</span></div><WhatsAppSupportButton trackingId={recentTrackingNumber()} className="dhl-settings-row dhl-settings-row-button"><WhatsAppIcon size={18}/> WhatsApp Support <span><ChevronRight size={17}/></span></WhatsAppSupportButton></div></section>
    {isDemoShipmentEnabled() && <section className="dhl-settings-group"><h2>Developer (development build only)</h2><div className="dhl-card dhl-settings-list dhl-dev-helper"><div className="dhl-settings-row"><Info size={18}/> Demo tracking <code>{DEMO_TRACKING_ID}</code><button type="button" onClick={resetDemoChat}>Reset demo chat</button></div></div></section>}
    <section className="dhl-settings-group"><h2>About</h2><div className="dhl-card dhl-settings-list"><div className="dhl-settings-row"><Info size={18}/> {brandConfig.appName} redesign concept <span>Version 0.1.0</span></div>{isAdmin && <Link className="dhl-settings-row" to="/admin"><Info size={18}/> Admin Dashboard <span><ChevronRight size={17}/></span></Link>}</div></section>
  </div>;
}
