import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock3, Package, Search } from 'lucide-react';
import { CopyFormLinkButton } from '../../features/shipments/ShipmentBits';
import { subscribeDevData } from '../../demo/devDataStore';
import { listShipmentRequests } from '../../services/shipmentRequestService';
import type { ShipmentRequest } from '../../services/shipmentRequestService';

type Tab = 'pending' | 'approved' | 'rejected';
const tabLabels: Record<Tab, string> = { pending: 'Pending Requests', approved: 'Approved', rejected: 'Rejected' };
const formatDate = (date: string) => new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const short = (value: string) => value.split(',').slice(-3, -1).join(',').trim() || value;

export default function AdminRequests() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('pending');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const data = await listShipmentRequests(); if (active) { setRequests(data); setError(''); } }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Requests could not be loaded.'); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const off = subscribeDevData(() => void load());
    return () => { active = false; off(); };
  }, []);
  const visible = useMemo(() => requests.filter(request => request.status === tab && [request.id, request.sender_name, request.recipient_name, request.origin, request.destination, request.payload.packageName].join(' ').toLowerCase().includes(query.toLowerCase())), [requests, tab, query]);
  const status = (request: ShipmentRequest) => <span className={`dhl-admin-status ${request.status === 'approved' ? 'delivered' : request.status === 'rejected' ? 'alert' : 'transit'}`}>{request.status === 'pending' ? 'Pending Review' : request.status === 'approved' ? 'Approved' : 'Rejected'}</span>;
  return <div className="dhl-admin-requests">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">CUSTOMER INTAKE</span><h1>Shipment Requests</h1><p>Review customer requests, add the operational details and approve.</p></div><div className="dhl-admin-page-actions"><CopyFormLinkButton /></div></div>
    {error && <p className="dhl-admin-banner error" role="alert">{error}</p>}
    <section className="dhl-admin-card">
      <div className="dhl-admin-list-controls"><div className="dhl-admin-list-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search sender, receiver or package" aria-label="Search requests" /></div><span className="dhl-admin-list-count">{requests.length} total</span></div>
      <div className="dhl-admin-tabs shipment-tabs" role="tablist" aria-label="Request status">{(Object.keys(tabLabels) as Tab[]).map(value => <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{tabLabels[value]} <small>{requests.filter(item => item.status === value).length}</small></button>)}</div>
      {loading ? <div className="dhl-admin-empty"><Clock3 size={23} /><strong>Loading requests…</strong></div>
        : visible.length ? <>
          <div className="dhl-admin-table-wrap dhl-admin-request-table"><table className="dhl-admin-table"><thead><tr><th>Request</th><th>Sender</th><th>Receiver</th><th>Route</th><th>Package</th><th>Submitted</th><th>Status</th><th /></tr></thead><tbody>{visible.map(request => <tr key={request.id}>
            <td className="mono">{request.id.slice(0, 8).toUpperCase()}</td><td>{request.sender_name}</td><td>{request.recipient_name}</td><td>{short(request.origin)} → {short(request.destination)}</td><td>{request.payload.packageName}</td><td>{formatDate(request.created_at)}</td><td>{status(request)}</td>
            <td><Link className="dhl-admin-text-action" to={`/admin/requests/${request.id}`}>Review <ChevronRight size={15} /></Link></td>
          </tr>)}</tbody></table></div>
          <div className="dhl-admin-request-cards">{visible.map(request => <Link key={request.id} to={`/admin/requests/${request.id}`}><span><strong>{request.sender_name} → {request.recipient_name}</strong><small>{formatDate(request.created_at)}</small></span><span>{request.payload.packageName}</span><span>{short(request.origin)} → {short(request.destination)}</span>{status(request)}</Link>)}</div>
        </>
        : <div className="dhl-admin-empty"><Package size={24} /><strong>No {tabLabels[tab].toLowerCase()}</strong><span>Share the customer shipment form link to receive requests.</span></div>}
    </section>
  </div>;
}
