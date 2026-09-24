import { Link, NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Bell, ChevronDown, CircleHelp, LayoutDashboard, MessageCircle, Package, Plus, Settings, Truck, Users, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { brandConfig } from '../../../config/brand';
import { supabase } from '../../../lib/supabase';

type Props = { onNavigate?: () => void; onClose?: () => void; compact?: boolean };

const navigation = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Shipments', to: '/admin/shipments', icon: Package },
  { label: 'Create Shipment', to: '/admin/shipments/new', icon: Plus },
  { label: 'Shipment Requests', to: '/admin/requests', icon: Truck },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Support & Chat', to: '/admin/chat', icon: MessageCircle },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ onNavigate, onClose, compact = false }: Props) {
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const activeFor = (to: string, exact?: boolean) => exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/');
  return <aside className={`dhl-admin-sidebar${compact ? ' compact' : ''}`} aria-label="Admin navigation">
    <div className="dhl-admin-brand"><Link to="/admin" onClick={onNavigate} aria-label="DHL Admin Dashboard"><img src={brandConfig.cinematicLogo} alt="DHL Express" /></Link>{onClose && <button type="button" onClick={onClose} aria-label="Close admin navigation"><X size={20} /></button>}</div>
    <div className="dhl-admin-sidebar-intro"><span>OPERATIONS CONSOLE</span><strong>Command center</strong></div>
    <nav className="dhl-admin-navigation">
      {navigation.map(({ label, to, icon: Icon, exact }) => <NavLink key={to} to={to} onClick={onNavigate} className={activeFor(to, exact) ? 'active' : ''} title={label}><Icon size={18} strokeWidth={1.9} aria-hidden="true" /><span>{label}</span></NavLink>)}
    </nav>
    <div className="dhl-admin-sidebar-bottom">
      <Link className="dhl-admin-sidebar-help" to="/admin/settings" onClick={onNavigate}><CircleHelp size={18} /><span>Help & settings</span></Link>
      <button type="button" className="dhl-admin-profile" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen}><span className="dhl-admin-avatar"><UserRound size={19} /></span><span className="dhl-admin-profile-copy"><strong>Admin</strong><small>Administrator access</small></span><ChevronDown size={16} /></button>
      {profileOpen && <div className="dhl-admin-profile-menu"><Link to="/admin/settings" onClick={() => { setProfileOpen(false); onNavigate?.(); }}>Profile & settings</Link><button type="button" onClick={() => { void supabase.auth.signOut(); setProfileOpen(false); }}>Sign out</button></div>}
    </div>
  </aside>;
}
