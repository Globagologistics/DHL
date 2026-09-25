import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit3, Eye, FileText, MessageCircle, Package, Plus, RefreshCcw, Search } from 'lucide-react';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import { formatTrackingNumber } from '../../services/trackingService';
import { CopyFormLinkButton, LifecycleBadge } from '../../features/shipments/ShipmentBits';
import type { LifecycleState } from '../../types/database';

type Filter = 'all' | 'scheduled' | 'awaiting' | 'in_transit' | 'on_hold' | 'delivered' | 'closed';
const filters: { label: string; value: Filter; states: LifecycleState[] }[] = [
  { label: 'All', value: 'all', states: [] },
  { label: 'Scheduled', value: 'scheduled', states: ['draft', 'scheduled'] },
  { label: 'Awaiting Takeoff', value: 'awaiting', states: ['awaiting_takeoff'] },
  { label: 'In Transit', value: 'in_transit', states: ['in_transit'] },
  { label: 'Paused / Stopped', value: 'on_hold', states: ['paused', 'stopped'] },
  { label: 'Delivered', value: 'delivered', states: ['delivered'] },
  { label: 'Cancelled / Terminated', value: 'closed', states: ['cancelled', 'terminated'] },
];
const editable: LifecycleState[] = ['draft', 'scheduled', 'awaiting_takeoff'];
const formatDate = (date?: string | null) => date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const stateOf = (shipment: Shipment): LifecycleState => shipment.lifecycleState || 'in_transit';
/** Customer-facing number once published, otherwise the short record id. */
const referenceOf = (shipment: Shipment) => shipment.trackingNumber ? formatTrackingNumber(shipment.trackingNumber) : `Draft · ${shipment.id.slice(0, 8).toUpperCase()}`;
const place = (value?: string) => (value || '').split(',').slice(-3, -1).join(',').trim() || value || '—';
const PAGE_SIZE = 10;

export default function AdminShipments() {
  const { shipments, loading, error } = useContext(AdminContext);
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') || '');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  useEffect(() => setQuery(params.get('search') || ''), [params]);
  useEffect(() => setPage(1), [query, filter]);
  const filtered = useMemo(() => shipments.filter(shipment => {
    const rule = filters.find(item => item.value === filter)!;
    const matchesFilter = filter === 'all' || rule.states.includes(stateOf(shipment));
    const needle = query.trim().toLowerCase().replace(/\s/g, '');
    const haystack = [shipment.id, shipment.trackingNumber || '', shipment.senderName, shipment.receiverName, shipment.receiverEmail, shipment.pickupLocation, shipment.deliveryAddress, shipment.packageName].join(' ').toLowerCase().replace(/\s/g, '');
    return matchesFilter && (!needle || haystack.includes(needle));
  }), [shipments, query, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const actions = (shipment: Shipment) => <>
    <Link to={`/admin/shipments/${shipment.id}`} title="View" aria-label={`View ${referenceOf(shipment)}`}><Eye size={16} /></Link>
    {editable.includes(stateOf(shipment)) && <Link to={`/admin/shipments/${shipment.id}/edit`} title="Edit" aria-label={`Edit ${referenceOf(shipment)}`}><Edit3 size={16} /></Link>}
    <Link to={`/admin/shipments/${shipment.id}`} title="Update status" aria-label={`Update status of ${referenceOf(shipment)}`}><RefreshCcw size={16} /></Link>
    <Link to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`} title="Chat" aria-label={`Chat about ${referenceOf(shipment)}`}><MessageCircle size={16} /></Link>
    <Link to={`/admin/shipments/${shipment.id}?tab=photos`} title="Documents" aria-label={`Documents for ${referenceOf(shipment)}`}><FileText size={16} /></Link>
  </>;
  return <div className="dhl-admin-shipments">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Shipments</h1><p>Create, publish, start and monitor every shipment.</p></div><div className="dhl-admin-page-actions"><CopyFormLinkButton /><Link className="dhl-admin-button primary" to="/admin/shipments/new"><Plus size={17} /> Create Shipment</Link></div></div>
    {error && <p className="dhl-admin-banner error" role="alert">{error}</p>}
    <section className="dhl-admin-card">
      <div className="dhl-admin-list-controls"><div className="dhl-admin-list-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search tracking number, customer or destination" aria-label="Search shipments" /></div><span className="dhl-admin-list-count">{filtered.length} shipments</span></div>
      <div className="dhl-admin-tabs shipment-tabs" role="tablist" aria-label="Shipment status">{filters.map(item => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} className={filter === item.value ? 'active' : ''} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
      {loading && !shipments.length ? <div className="dhl-admin-empty"><Package size={23} /><strong>Loading shipments…</strong></div>
        : !visible.length ? <div className="dhl-admin-empty"><Package size={24} /><strong>No matching shipments</strong><span>Try a different search or status.</span></div>
          : <>
            <div className="dhl-admin-table-wrap dhl-admin-shipment-table"><table className="dhl-admin-table"><thead><tr><th>Tracking number</th><th>Package</th><th>Receiver</th><th>Route</th><th>Status</th><th>Est. delivery</th><th>Actions</th></tr></thead><tbody>{visible.map(shipment => <tr key={shipment.id}>
              <td className="mono"><Link to={`/admin/shipments/${shipment.id}`}>{referenceOf(shipment)}</Link>{shipment.isDemo && <small className="dhl-admin-demo-badge">Demo</small>}</td>
              <td><strong>{shipment.packageName || 'Shipment'}</strong><small>{shipment.transportation}</small></td>
              <td><strong>{shipment.receiverName || 'Not provided'}</strong><small>{shipment.receiverEmail || shipment.receiverPhone}</small></td>
              <td>{place(shipment.pickupLocation)} → {place(shipment.deliveryAddress)}</td>
              <td><LifecycleBadge state={stateOf(shipment)} /></td>
              <td>{formatDate(shipment.estimatedDeliveryAt)}</td>
              <td><div className="dhl-admin-row-actions">{actions(shipment)}</div></td>
            </tr>)}</tbody></table></div>
            <div className="dhl-admin-mobile-shipments">{visible.map(shipment => <article key={shipment.id}><div><Link to={`/admin/shipments/${shipment.id}`}>{referenceOf(shipment)}</Link><LifecycleBadge state={stateOf(shipment)} /></div><strong>{shipment.packageName || 'Shipment'} · {shipment.receiverName}</strong><p>{place(shipment.pickupLocation)} → {place(shipment.deliveryAddress)}</p><small>Est. delivery {formatDate(shipment.estimatedDeliveryAt)}</small><div className="dhl-admin-mobile-actions"><Link className="dhl-admin-mobile-action primary" to={`/admin/shipments/${shipment.id}`}>Open Control Panel</Link><Link className="dhl-admin-mobile-action" to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`}>Chat</Link>{editable.includes(stateOf(shipment)) && <Link className="dhl-admin-mobile-action" to={`/admin/shipments/${shipment.id}/edit`}>Edit</Link>}</div></article>)}</div>
            <div className="dhl-admin-pagination"><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Previous page"><ChevronLeft size={17} /></button><span>{page} / {pageCount}</span><button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
          </>}
    </section>
  </div>;
}
