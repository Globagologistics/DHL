import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, Settings, UserRound } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import { environment } from '../../config/environment';

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setDrawerOpen(false), [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [drawerOpen]);
  // The dedicated conversation screen fills the viewport; only its message list scrolls.
  const chatFocus = /^\/admin\/chat\/[^/]+/.test(location.pathname);
  return <div className={`dhl-admin-app${chatFocus ? ' chat-focus' : ''}`}>
    <div className="dhl-admin-sidebar-desktop"><AdminSidebar /></div>
    <div className={`dhl-admin-drawer-layer${drawerOpen ? ' open' : ''}`} aria-hidden={!drawerOpen}><button className="dhl-admin-drawer-scrim" type="button" onClick={() => setDrawerOpen(false)} tabIndex={drawerOpen ? 0 : -1} aria-label="Close admin navigation" /><AdminSidebar onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} /></div>
    <div className="dhl-admin-workspace">
      <header className="dhl-admin-topbar">
        <button type="button" className="dhl-admin-menu-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open admin navigation"><Menu size={21} /></button>
        <div className="dhl-admin-topbar-title"><span>OPERATIONS</span><strong>DHL Express</strong></div>
        <form className="dhl-admin-global-search" onSubmit={event => { event.preventDefault(); navigate(`/admin/shipments?search=${encodeURIComponent(query.trim())}`); }} role="search"><Search size={18} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Search shipments" placeholder="Search shipments, customers, tracking numbers..." /><kbd>↵</kbd></form>
        <div className="dhl-admin-top-actions"><span className="dhl-admin-live"><i /> Live operations</span><Link to="/admin/notifications" aria-label="Notifications"><Bell size={19} /></Link><Link to="/admin/settings" aria-label="Settings"><Settings size={19} /></Link><Link className="dhl-admin-top-avatar" to="/admin/settings" aria-label="Admin profile"><UserRound size={18} /></Link></div>
      </header>
      <main className="dhl-admin-main">{environment.devAdminBypass && <p className="dhl-admin-dev-banner">Development view only — authenticated backend operations remain protected.</p>}<Outlet /></main>
    </div>
  </div>;
}
