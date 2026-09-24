import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit3, Eye, FileText, MessageCircle, Package, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { AdminContext, type Shipment } from '../contexts/AdminContext';
import { formatTrackingNumber } from '../../services/trackingService';

type Filter = 'all' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';
const filters: {label:string;value:Filter}[] = [{label:'All',value:'all'},{label:'Pending',value:'pending'},{label:'In Transit',value:'in_transit'},{label:'Delivered',value:'delivered'},{label:'Cancelled',value:'cancelled'}];
const activeStatuses = new Set(['picked_up','in_transit','customs_processing','out_for_delivery']);
const pendingStatuses = new Set(['processing','pickup_scheduled','paused','on_hold']);
const statusOf = (shipment:Shipment) => shipment.terminated || shipment.status === 'cancelled' ? 'cancelled' : shipment.status || 'processing';
const statusTone = (status:string) => status === 'delivered' ? 'delivered' : status === 'cancelled' || status === 'delayed' || status === 'stopped' ? 'alert' : activeStatuses.has(status) ? 'transit' : 'pending';
const formatStatus = (status:string) => status.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const formatDate = (date?:string|null) => date ? new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—';
const PAGE_SIZE = 10;
/** Customer-facing number when assigned, otherwise the short record id. */
const referenceOf = (shipment:Shipment) => shipment.trackingNumber ? formatTrackingNumber(shipment.trackingNumber) : shipment.id.slice(0,13).toUpperCase();

export default function AdminShipments() {
  const { shipments, deleteShipment, loading, error } = useContext(AdminContext);
  const [params] = useSearchParams();
  const [query,setQuery] = useState(params.get('search') || '');
  const [filter,setFilter] = useState<Filter>('all');
  const [page,setPage] = useState(1);
  const [deleteTarget,setDeleteTarget] = useState<Shipment|null>(null);
  const [deleteError,setDeleteError] = useState('');
  useEffect(() => setQuery(params.get('search') || ''),[params]);
  useEffect(() => setPage(1),[query,filter]);
  const filtered = useMemo(() => shipments.filter(shipment => {
    const status = statusOf(shipment);
    const matchesFilter = filter === 'all' || filter === 'in_transit' && activeStatuses.has(status) || filter === 'pending' && pendingStatuses.has(status) || filter === status;
    const needle = query.trim().toLowerCase();
    const haystack = [shipment.id,shipment.trackingNumber||'',shipment.senderName,shipment.receiverName,shipment.senderEmail,shipment.receiverEmail,shipment.pickupLocation,shipment.deliveryAddress,shipment.packageName].join(' ').toLowerCase();
    return matchesFilter && (!needle || haystack.includes(needle));
  }),[shipments,query,filter]);
  const pageCount = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible = filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    try { await deleteShipment(deleteTarget.id); setDeleteTarget(null); }
    catch { setDeleteError('Shipment could not be deleted. Please try again.'); }
  };
  return <div className="dhl-admin-shipments">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">SHIPMENT OPERATIONS</span><h1>Shipments</h1><p>Manage and monitor all shipments.</p></div><div className="dhl-admin-page-actions"><Link className="dhl-admin-button primary" to="/admin/shipments/new"><Plus size={17}/> Create Shipment</Link></div></div>
    {error && <p className="dhl-admin-banner error" role="alert">{error}</p>}
    <section className="dhl-admin-card"><div className="dhl-admin-list-controls"><div className="dhl-admin-list-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search tracking number, customer or destination" aria-label="Search shipments" /></div><span className="dhl-admin-list-count">{filtered.length} shipments</span></div><div className="dhl-admin-tabs shipment-tabs" role="tablist" aria-label="Shipment status">{filters.map(item=><button key={item.value} type="button" role="tab" aria-selected={filter===item.value} className={filter===item.value?'active':''} onClick={()=>setFilter(item.value)}>{item.label}</button>)}</div>
      {loading && !shipments.length ? <div className="dhl-admin-empty"><Package size={23}/><strong>Loading shipments...</strong></div> : !visible.length ? <div className="dhl-admin-empty"><Package size={24}/><strong>No matching shipments</strong><span>Try a different search or status.</span></div> : <><div className="dhl-admin-table-wrap dhl-admin-shipment-table"><table className="dhl-admin-table"><thead><tr><th>Tracking number</th><th>Customer</th><th>Origin</th><th>Destination</th><th>Status</th><th>Created</th><th>Expected delivery</th><th>Actions</th></tr></thead><tbody>{visible.map(shipment=><tr key={shipment.id}><td className="mono"><Link to={`/admin/shipments/${shipment.id}`}>{referenceOf(shipment)}</Link></td><td><strong>{shipment.receiverName||'Not provided'}</strong><small>{shipment.receiverEmail||shipment.receiverPhone}</small></td><td>{shipment.pickupLocation||'—'}</td><td>{shipment.deliveryAddress||'—'}</td><td><span className={`dhl-admin-status ${statusTone(statusOf(shipment))}`}>{formatStatus(statusOf(shipment))}</span></td><td>{formatDate(shipment.createdAt)}</td><td>{formatDate(shipment.estimatedDeliveryAt)}</td><td><div className="dhl-admin-row-actions"><Link to={`/admin/shipments/${shipment.id}`} title="View" aria-label={`View ${shipment.id}`}><Eye size={16}/></Link><Link to={`/admin/shipments/${shipment.id}/edit`} title="Edit" aria-label={`Edit ${referenceOf(shipment)}`}><Edit3 size={16}/></Link><Link to={`/admin/shipments/${shipment.id}?tab=controls`} title="Update status" aria-label={`Update status of ${referenceOf(shipment)}`}><RefreshCcw size={16}/></Link><Link to={`/admin/shipments/${shipment.id}?tab=documents`} title="Documents" aria-label={`Documents for ${referenceOf(shipment)}`}><FileText size={16}/></Link><Link to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`} title="Chat" aria-label={`Chat about ${shipment.id}`}><MessageCircle size={16}/></Link><button type="button" title="Delete" aria-label={`Delete ${shipment.id}`} onClick={()=>setDeleteTarget(shipment)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div><div className="dhl-admin-mobile-shipments">{visible.map(shipment=><article key={shipment.id}><div><Link to={`/admin/shipments/${shipment.id}`}>{referenceOf(shipment)}</Link><span className={`dhl-admin-status ${statusTone(statusOf(shipment))}`}>{formatStatus(statusOf(shipment))}</span></div><strong>{shipment.receiverName||'Not provided'}</strong><p>{shipment.pickupLocation||'Origin not set'} → {shipment.deliveryAddress||'Destination not set'}</p><small>Created {formatDate(shipment.createdAt)}</small><div className="dhl-admin-mobile-actions"><Link to={`/admin/shipments/${shipment.id}`}>View</Link><Link to={`/admin/shipments/${shipment.id}/edit`}>Edit</Link><Link to={`/admin/shipments/${shipment.id}?tab=controls`}>Status</Link><Link to={`/admin/shipments/${shipment.id}?tab=documents`}>Documents</Link><Link to={`/admin/chat?tracking=${encodeURIComponent(shipment.id)}`}>Chat</Link><button type="button" onClick={()=>setDeleteTarget(shipment)}>Delete</button></div></article>)}</div><div className="dhl-admin-pagination"><span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span><div><button type="button" onClick={()=>setPage(value=>Math.max(1,value-1))} disabled={page===1} aria-label="Previous page"><ChevronLeft size={17}/></button><span>{page} / {pageCount}</span><button type="button" onClick={()=>setPage(value=>Math.min(pageCount,value+1))} disabled={page===pageCount} aria-label="Next page"><ChevronRight size={17}/></button></div></div></>}
    </section>
    {deleteTarget && <div className="dhl-admin-modal-layer" onMouseDown={event=>{if(event.target===event.currentTarget)setDeleteTarget(null);}}><section role="dialog" aria-modal="true" aria-label="Delete shipment" className="dhl-admin-confirm"><span className="dhl-admin-confirm-icon"><Trash2 size={22}/></span><h2>Delete this shipment?</h2><p>This will remove the shipment and may affect related records. This action cannot be undone.</p><code>{referenceOf(deleteTarget)}</code>{deleteError&&<p className="dhl-admin-banner error">{deleteError}</p>}<div><button type="button" className="dhl-admin-button" onClick={()=>setDeleteTarget(null)}>Cancel</button><button type="button" className="dhl-admin-button primary" onClick={()=>void remove()}>Delete shipment</button></div></section></div>}
  </div>;
}
