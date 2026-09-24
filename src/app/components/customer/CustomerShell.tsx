import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Headphones, Home, Menu, MoreHorizontal, Package, Search, Settings, ShieldQuestion, UserRound, X } from 'lucide-react';
import { appConfig } from '../../../config/app';
import { environment } from '../../../config/environment';
import { TrackingNumberInput } from '../../../features/tracking/TrackingNumberInput';
import { AUTO_LOOKUP_DEBOUNCE_MS } from '../../../features/tracking/useTrackingLookup';
import { WhatsAppIcon, WhatsAppSupportButton } from '../../../features/whatsapp/WhatsAppSupport';
import { TRACKING_NUMBER_LENGTH, recentTrackingNumber } from '../../../services/trackingService';

const primaryLinks = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Track Shipment', path: '/track', icon: Search },
  { label: 'Send Shipment', path: '/send-shipment', icon: Package },
  { label: 'Customer Support', path: '/chat', icon: Headphones },
];
const secondaryLinks = [
  { label: 'Notifications', path: '/settings#notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Help Center', path: '/chat', icon: ShieldQuestion },
];

export function BrandLogo({ unboxed = false }: { unboxed?: boolean }) {
  return <Link to={appConfig.routes.home} aria-label={`${appConfig.brand.appName} home`} className="dhl-brand-link"><img src={unboxed ? appConfig.brand.cinematicLogo : appConfig.brand.logo} alt={appConfig.brand.appName} /></Link>;
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const adminShortcut = useRef<{ count: number; timer: number | null }>({ count: 0, timer: null });
  useEffect(() => () => { if (adminShortcut.current.timer !== null) window.clearTimeout(adminShortcut.current.timer); }, []);
  const tapGuestIcon = () => {
    if (!environment.enableAdminShortcut) return;
    const state = adminShortcut.current;
    if (state.count === 0) state.timer = window.setTimeout(() => { state.count = 0; state.timer = null; }, 5000);
    state.count += 1;
    if (state.count >= 10) {
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.count = 0;
      state.timer = null;
      setDrawerOpen(false);
      navigate('/admin');
    }
  };
  const isWelcome = location.pathname === '/';
  const special = isWelcome || location.pathname === '/chat';
  const isHome = location.pathname === '/home';
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [drawerOpen]);
  return <div className={`dhl-app${isHome ? ' dhl-app-home' : ''}`}>
    {/* Customer header: menu and logo only. Notifications, settings and developer controls stay out of it. */}
    {!special && <header className="dhl-header"><div className="dhl-header-inner dhl-header-minimal">
      <button className="dhl-icon-button dhl-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu size={22}/></button>
      <BrandLogo unboxed={isHome}/>
      <span className="dhl-header-balance" aria-hidden="true"/>
    </div></header>}
    <main className={special ? 'dhl-main dhl-main-special' : 'dhl-main'}>{children}</main>
    {!special && <button className="dhl-floating-support" onClick={() => navigate('/chat')} aria-label="Customer support"><Headphones size={20}/><span>Support</span></button>}
    {!isWelcome &&
      <nav className="dhl-bottom-nav" aria-label="Mobile navigation">
        <Link className={location.pathname === '/home' ? 'active' : ''} to="/home"><Home size={22}/><span>Home</span></Link>
        <Link className={location.pathname.startsWith('/track') ? 'active' : ''} to="/track"><Search size={22}/><span>Track</span></Link>
        <Link className={location.pathname === '/chat' ? 'active' : ''} to="/chat"><Headphones size={22}/><span>Support</span></Link>
        <button onClick={() => setDrawerOpen(true)}><MoreHorizontal size={22}/><span>More</span></button>
      </nav>
    }
    <div className={`dhl-drawer-layer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
      <button className="dhl-drawer-scrim" onClick={() => setDrawerOpen(false)} tabIndex={drawerOpen ? 0 : -1} aria-label="Close navigation"/>
      <aside className="dhl-drawer" aria-label="Navigation drawer"><div className="dhl-drawer-top"><BrandLogo/><button className="dhl-icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X size={22}/></button></div>
        <div className="dhl-drawer-guest"><button type="button" className="dhl-guest-avatar-button" onClick={tapGuestIcon} aria-label="Guest profile"><UserRound size={22}/></button><div><strong>Guest</strong><small>Track and manage your shipments</small></div></div>
        <nav>
          {primaryLinks.map(({ label, path, icon: Icon }) => <Link key={label} to={path} onClick={() => setDrawerOpen(false)}><span className="dhl-drawer-link-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight size={16}/></Link>)}
          <WhatsAppSupportButton trackingId={recentTrackingNumber()} className="dhl-drawer-whatsapp"><span className="dhl-drawer-link-icon whatsapp"><WhatsAppIcon size={18}/></span><span>WhatsApp Support</span><ChevronRight size={16}/></WhatsAppSupportButton>
          {secondaryLinks.map(({ label, path, icon: Icon }) => <Link key={label} to={path} onClick={() => setDrawerOpen(false)}><span className="dhl-drawer-link-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight size={16}/></Link>)}
        </nav>
        <Link className="dhl-drawer-signin" to="/signin" onClick={() => setDrawerOpen(false)}><UserRound size={18}/> Sign in</Link>
      </aside>
    </div>
  </div>;
}

export function PageHeading({ title, backTo, eyebrow }: { title: string; backTo?: string; eyebrow?: string }) {
  return <div className="dhl-page-heading">{backTo && <Link to={backTo} className="dhl-back-link">← Back</Link>}{eyebrow && <span className="dhl-eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>;
}

/**
 * Home-page tracking entry. Accepts digits only (max 12); a complete number
 * hands off to the Track page, which runs the search and result states.
 */
export function TrackingForm({ compact = false }: { compact?: boolean }) {
  const [digits, setDigits] = useState('');
  const [incomplete, setIncomplete] = useState(false);
  const navigate = useNavigate();
  const fieldId = useId();
  const timer = useRef<number | null>(null);
  const clearTimer = () => { if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; } };
  useEffect(() => clearTimer, []);
  const open = (value: string) => { clearTimer(); navigate(`/track?id=${value}`); };
  const change = (value: string) => {
    setDigits(value);
    setIncomplete(false);
    clearTimer();
    if (value.length === TRACKING_NUMBER_LENGTH) timer.current = window.setTimeout(() => open(value), AUTO_LOOKUP_DEBOUNCE_MS);
  };
  const helper = incomplete ? 'Enter the complete 12-digit tracking number.' : digits.length === TRACKING_NUMBER_LENGTH ? 'Searching…' : digits ? 'Tracking numbers contain 12 digits.' : '';
  return <form className={`dhl-tracking-form ${compact ? 'compact' : ''}`} noValidate onSubmit={event => { event.preventDefault(); if (digits.length === TRACKING_NUMBER_LENGTH) open(digits); else setIncomplete(true); }}>
    <label className={`dhl-tracking-field${incomplete ? ' invalid' : ''}`} htmlFor={fieldId}><Search size={19} aria-hidden="true"/><TrackingNumberInput id={fieldId} value={digits} onValueChange={change} placeholder="Enter 12-digit tracking number" aria-label="Tracking number" aria-describedby={`${fieldId}-helper`} aria-invalid={incomplete}/></label>
    <button className="dhl-primary-button" type="submit">Track Shipment <ChevronRight size={18}/></button>
    <p id={`${fieldId}-helper`} className={`dhl-tracking-helper${incomplete ? ' error' : ''}`} role={incomplete ? 'alert' : undefined} aria-live="polite">{helper}</p>
  </form>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`dhl-status ${status.toLowerCase().replace(/[^a-z]+/g, '-')}`}><span/>{status}</span>;
}

export function ShipmentProgress({ value }: { value: number }) {
  const milestones = ['Booked', 'Picked up', 'In transit', 'Delivered'];
  const current = value >= 100 ? 3 : value >= 55 ? 2 : value > 5 ? 1 : 0;
  return <div className="dhl-progress" aria-label={`Shipment progress ${value}%`}>
    <div className="dhl-progress-line"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div>
    <div className="dhl-progress-steps">{milestones.map((step, index) => <div className={index <= current ? 'done' : ''} key={step}><span className="dhl-progress-node">{index < current ? '✓' : ''}</span><small>{step}</small></div>)}</div>
  </div>;
}
