import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Headphones, Home, MapPin, Menu, MoreHorizontal, Package, Search, Settings, ShieldQuestion, Truck, UserRound, X } from 'lucide-react';
import { appConfig } from '../../../config/app';

const links = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Track Shipment', path: '/track', icon: Search },
  { label: 'Send Shipment', path: '/send-shipment', icon: Package },
  { label: 'Customer Support', path: '/chat', icon: Headphones },
  { label: 'Service Points', path: '/locations', icon: MapPin },
  { label: 'Notifications', path: '/settings#notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Help Center', path: '/chat', icon: ShieldQuestion },
];

export function BrandLogo() {
  return <Link to={appConfig.routes.home} aria-label={`${appConfig.brand.appName} home`} className="dhl-brand-link"><img src={appConfig.brand.logo} alt={appConfig.brand.appName} /></Link>;
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const special = location.pathname === '/' || location.pathname === '/chat';
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [drawerOpen]);
  return <div className="dhl-app">
    {!special && <header className="dhl-header"><div className="dhl-header-inner">
      <button className="dhl-icon-button dhl-menu-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu size={22}/></button>
      <BrandLogo/>
      <nav className="dhl-desktop-nav" aria-label="Main navigation">
        <Link to="/home">Home</Link><Link to="/track">Track</Link><Link to="/send-shipment">Send a Shipment</Link><Link to="/chat">Support</Link>
      </nav>
      <div className="dhl-header-actions"><Link className="dhl-icon-button" to="/settings#notifications" aria-label="Notifications"><Bell size={20}/></Link><Link className="dhl-signin" to="/signin"><UserRound size={17}/> Sign in</Link></div>
    </div></header>}
    <main className={special ? 'dhl-main dhl-main-special' : 'dhl-main'}>{children}</main>
    {!special && <>
      <button className="dhl-floating-support" onClick={() => navigate('/chat')} aria-label="Customer support"><Headphones size={20}/><span>Support</span></button>
      <nav className="dhl-bottom-nav" aria-label="Mobile navigation">
        <Link className={location.pathname === '/home' ? 'active' : ''} to="/home"><Home size={22}/><span>Home</span></Link>
        <Link className={location.pathname.startsWith('/track') ? 'active' : ''} to="/track"><Search size={22}/><span>Track</span></Link>
        <Link to="/chat"><Headphones size={22}/><span>Support</span></Link>
        <button onClick={() => setDrawerOpen(true)}><MoreHorizontal size={22}/><span>More</span></button>
      </nav>
    </>}
    <div className={`dhl-drawer-layer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
      <button className="dhl-drawer-scrim" onClick={() => setDrawerOpen(false)} tabIndex={drawerOpen ? 0 : -1} aria-label="Close navigation"/>
      <aside className="dhl-drawer" aria-label="Navigation drawer"><div className="dhl-drawer-top"><BrandLogo/><button className="dhl-icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X size={22}/></button></div>
        <div className="dhl-drawer-guest"><span><UserRound size={22}/></span><div><strong>Guest</strong><small>Track and manage your shipments</small></div></div>
        <nav>{links.map(({ label, path, icon: Icon }) => <Link key={label} to={path} onClick={() => setDrawerOpen(false)}><span className="dhl-drawer-link-icon"><Icon size={18}/></span><span>{label}</span><ChevronRight size={16}/></Link>)}</nav>
        <Link className="dhl-drawer-signin" to="/signin" onClick={() => setDrawerOpen(false)}><UserRound size={18}/> Sign in</Link>
      </aside>
    </div>
  </div>;
}

export function PageHeading({ title, backTo, eyebrow }: { title: string; backTo?: string; eyebrow?: string }) {
  return <div className="dhl-page-heading">{backTo && <Link to={backTo} className="dhl-back-link">← Back</Link>}{eyebrow && <span className="dhl-eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>;
}

export function TrackingForm({ initialValue = '', compact = false }: { initialValue?: string; compact?: boolean }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  useEffect(() => setValue(initialValue), [initialValue]);
  return <form className={`dhl-tracking-form ${compact ? 'compact' : ''}`} onSubmit={event => { event.preventDefault(); if (value.trim()) navigate(`/track/${encodeURIComponent(value.trim())}`); }}>
    <label className="dhl-tracking-field"><Search size={19}/><input value={value} onChange={event => setValue(event.target.value)} placeholder="Enter tracking number" aria-label="Tracking number" autoComplete="off"/></label>
    <button className="dhl-primary-button" type="submit">Track Shipment <ChevronRight size={18}/></button>
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
