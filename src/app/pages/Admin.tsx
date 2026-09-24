import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, Bell, ChevronRight, Clock3, Headphones, Package, Plus, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminContext } from '../contexts/AdminContext';
import { supabase } from '../../lib/supabase';
import { useChatThreads } from '../../hooks/useChat';
import { formatTrackingNumber } from '../../services/trackingService';
import { devShipmentLabel, listDevShipments } from '../../demo/devDataStore';

/** Development-store shipments counted alongside database rows (dev builds with the demo flag only). */
const devRows = () => listDevShipments().map(item => ({ id: item.id, sender_name: item.sender_name, receiver_name: item.receiver_name, delivery_address: item.delivery_address, status: item.status, created_at: item.created_at, delivered_at: item.delivered_at || null, cancelled_at: item.cancelled_at || null }));

type Period = 1 | 7 | 30;
type ActivityShipment = { id:string; sender_name:string; receiver_name:string; delivery_address:string; status:string; created_at:string; delivered_at:string|null; cancelled_at:string|null };
type NotificationPreview = { id:string; tracking_id:string; notification_type:string; delivery_status:string; recipient_type:string; created_at:string; sent_at:string|null };
type RequestPreview = { id:string; sender_name:string; recipient_name:string; origin:string; destination:string; created_at:string; status:string };

const inTransit = new Set(['picked_up','in_transit','customs_processing','out_for_delivery']);
const pending = new Set(['processing','pickup_scheduled','paused','on_hold']);
const statusClass = (status:string) => status === 'delivered' ? 'delivered' : status === 'cancelled' || status === 'delayed' || status === 'stopped' ? 'alert' : inTransit.has(status) ? 'transit' : 'pending';
const formatStatus = (status:string) => status.replaceAll('_',' ').replace(/\b\w/g, letter => letter.toUpperCase());
const shortDate = (date:string) => new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric'});

export default function Admin() {
  const { shipments, loading: shipmentLoading } = useContext(AdminContext);
  const { threads } = useChatThreads();
  const [period, setPeriod] = useState<Period>(7);
  const [rows, setRows] = useState<ActivityShipment[]>([]);
  const [requests, setRequests] = useState<RequestPreview[]>([]);
  const [requestsAvailable, setRequestsAvailable] = useState(true);
  const [notifications, setNotifications] = useState<NotificationPreview[]>([]);
  const [notificationsAvailable, setNotificationsAvailable] = useState(true);
  const [dataError, setDataError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { if (!cancelled) { setRows(devRows()); setLoading(false); } return; }
      const [shipmentResult, requestResult, notificationResult] = await Promise.all([
        supabase.from('shipments').select('id,sender_name,receiver_name,delivery_address,status,created_at,delivered_at,cancelled_at').eq('admin_id',auth.user.id).order('created_at',{ascending:false}).limit(2000),
        supabase.from('shipment_requests').select('id,sender_name,recipient_name,origin,destination,created_at,status').order('created_at',{ascending:false}).limit(100),
        supabase.from('notification_deliveries').select('id,tracking_id,notification_type,delivery_status,recipient_type,created_at,sent_at').order('created_at',{ascending:false}).limit(5),
      ]);
      if (cancelled) return;
      setRows([...devRows(), ...((shipmentResult.data || []) as ActivityShipment[])]);
      setDataError(shipmentResult.error ? 'Shipment activity could not be loaded.' : '');
      setRequests((requestResult.data || []) as RequestPreview[]);
      setRequestsAvailable(!requestResult.error);
      setNotifications((notificationResult.data || []) as NotificationPreview[]);
      setNotificationsAvailable(!notificationResult.error);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [shipments]);

  const periodRows = useMemo(() => {
    const since = Date.now() - period * 86400000;
    return rows.filter(row => new Date(row.created_at).getTime() >= since);
  }, [rows,period]);
  const chartData = useMemo(() => {
    const today = new Date();
    const days = Array.from({length:period},(_,i) => {
      const date = new Date(today); date.setHours(0,0,0,0); date.setDate(date.getDate()-(period-1-i));
      return { key:date.toISOString().slice(0,10), label:date.toLocaleDateString(undefined,{month:'short',day:'numeric'}), Created:0, Delivered:0, Cancelled:0 };
    });
    const byKey = new Map(days.map(day => [day.key,day]));
    rows.forEach(row => {
      const created = byKey.get(row.created_at.slice(0,10)); if (created) created.Created++;
      const delivered = row.delivered_at && byKey.get(row.delivered_at.slice(0,10)); if (delivered) delivered.Delivered++;
      const cancelled = row.cancelled_at && byKey.get(row.cancelled_at.slice(0,10)); if (cancelled) cancelled.Cancelled++;
    });
    return days;
  },[rows,period]);
  const distribution = useMemo(() => [
    {name:'Delivered',value:periodRows.filter(row => row.status === 'delivered').length,color:'#2e9b50'},
    {name:'In Transit',value:periodRows.filter(row => inTransit.has(row.status)).length,color:'#ffcc00'},
    {name:'Pending',value:periodRows.filter(row => pending.has(row.status)).length,color:'#85898f'},
    {name:'Cancelled',value:periodRows.filter(row => row.status === 'cancelled').length,color:'#d40511'},
    {name:'Other',value:periodRows.filter(row => !inTransit.has(row.status) && !pending.has(row.status) && row.status !== 'delivered' && row.status !== 'cancelled').length,color:'#3178c6'},
  ].filter(item => item.value > 0),[periodRows]);
  const pendingRequests = requests.filter(request => request.status === 'pending').length;
  const unreadChats = threads.reduce((sum,thread) => sum + thread.unreadForAdmin,0);
  const shipmentById = useMemo(() => new Map(shipments.map(item => [item.id,item])),[shipments]);
  const reference = (id:string) => { const demo = devShipmentLabel(id); if (demo) return demo; const number = shipmentById.get(id)?.trackingNumber; return number ? formatTrackingNumber(number) : id.slice(0,8).toUpperCase(); };
  const kpis = [
    {label:'Total Shipments',value:rows.length,icon:Package,tone:'yellow',detail:'Across your shipment portfolio',to:'/admin/shipments'},
    {label:'Pending Requests',value:requestsAvailable?pendingRequests:'—',icon:Clock3,tone:'red',detail:requestsAvailable?'Awaiting admin review':'Request backend not installed',to:'/admin/requests'},
    {label:'In Transit',value:rows.filter(row => inTransit.has(row.status)).length,icon:Truck,tone:'yellow',detail:'Moving through the network',to:'/admin/shipments'},
    {label:'Delivered',value:rows.filter(row => row.status === 'delivered').length,icon:CheckCircle2,tone:'green',detail:'Completed shipments',to:'/admin/shipments'},
    {label:'Cancelled',value:rows.filter(row => row.status === 'cancelled').length,icon:XCircle,tone:'red',detail:'Cancelled shipments',to:'/admin/shipments'},
    {label:'Support Conversations',value:threads.length,icon:Headphones,tone:'neutral',detail:`${unreadChats} unread messages`,to:'/admin/chat'},
  ];
  return <div className="dhl-admin-dashboard">
    <div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow"><Activity size={14} /> LIVE OVERVIEW</span><h1>Dashboard</h1><p>Real-time overview of your logistics operations.</p></div><div className="dhl-admin-page-actions"><div className="dhl-admin-period" aria-label="Date range">{([1,7,30] as Period[]).map(value => <button key={value} type="button" className={period===value?'active':''} onClick={() => setPeriod(value)}>{value===1?'Today':`${value} Days`}</button>)}</div><Link className="dhl-admin-button primary" to="/admin/shipments/new"><Plus size={16} /> Create Shipment</Link></div></div>
    {dataError && <p className="dhl-admin-banner error" role="alert">{dataError}</p>}
    <div className="dhl-admin-kpis">{kpis.map(({label,value,icon:Icon,tone,detail,to}) => <Link className="dhl-admin-kpi dhl-admin-card" key={label} to={to} aria-label={`${label}: ${loading||shipmentLoading?'loading':value}`}><div className="dhl-admin-kpi-top"><span className={`dhl-admin-kpi-icon ${tone}`}><Icon size={19} /></span><ChevronRight size={15} className="dhl-admin-kpi-arrow" aria-hidden="true" /></div><strong>{loading||shipmentLoading?'…':value}</strong><span>{label}</span><small>{detail}</small></Link>)}</div>
    <div className="dhl-admin-chart-grid"><section className="dhl-admin-card"><div className="dhl-admin-card-head"><div><h2>Shipment activity</h2><p>Created, delivered and cancelled by day</p></div><span className="dhl-admin-mini-live"><i /> Operational data</span></div><div className="dhl-admin-chart-area">{rows.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:10,right:10,bottom:0,left:-20}}><CartesianGrid vertical={false} stroke="#edf0f1" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fill:'#85898f',fontSize:10}} interval={period===30?4:0} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fill:'#85898f',fontSize:10}} /><Tooltip /><Bar dataKey="Created" fill="#ffcc00" radius={[4,4,0,0]} maxBarSize={22} /><Bar dataKey="Delivered" fill="#2e9b50" radius={[4,4,0,0]} maxBarSize={22} /><Bar dataKey="Cancelled" fill="#d40511" radius={[4,4,0,0]} maxBarSize={22} /></BarChart></ResponsiveContainer>:<div className="dhl-admin-empty"><Activity size={24}/><strong>No shipment activity yet</strong><span>Activity appears once shipments are created.</span></div>}</div><div className="dhl-admin-chart-legend"><span><i className="created"/>Created</span><span><i className="delivered"/>Delivered</span><span><i className="cancelled"/>Cancelled</span></div></section><section className="dhl-admin-card"><div className="dhl-admin-card-head"><div><h2>Status distribution</h2><p>Shipments created in selected period</p></div></div><div className="dhl-admin-donut-area">{distribution.length?<><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="89%" paddingAngle={2} stroke="none">{distribution.map(item=><Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="dhl-admin-donut-center"><strong>{periodRows.length}</strong><small>SHIPMENTS</small></div></>:<div className="dhl-admin-empty"><Package size={24}/><strong>No shipments in this period</strong></div>}</div><div className="dhl-admin-distribution-key">{distribution.map(item=><div key={item.name}><i style={{background:item.color}}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></section></div>
    <div className="dhl-admin-overview-grid"><section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Recent shipments</h2><Link to="/admin/shipments">View all <ArrowUpRight size={14}/></Link></div>{rows.length?<div className="dhl-admin-table-wrap"><table className="dhl-admin-table"><thead><tr><th>Tracking number</th><th>Customer</th><th>Status</th><th>Created</th></tr></thead><tbody>{rows.slice(0,5).map(row=><tr key={row.id}><td className="mono"><Link to={`/admin/shipments/${row.id}`}>{reference(row.id)}</Link></td><td>{row.receiver_name || row.sender_name || 'Not provided'}</td><td><span className={`dhl-admin-status ${statusClass(row.status)}`}>{formatStatus(row.status)}</span></td><td>{shortDate(row.created_at)}</td></tr>)}</tbody></table></div>:<div className="dhl-admin-empty"><Package size={22}/><strong>No shipments yet</strong></div>}</section><section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Recent requests</h2><Link to="/admin/requests">View all <ArrowUpRight size={14}/></Link></div>{!requestsAvailable?<div className="dhl-admin-empty"><Clock3 size={22}/><strong>Requests need backend setup</strong><span>Apply the shipment-request migration to enable this queue.</span></div>:requests.length?<div className="dhl-admin-compact-list">{requests.slice(0,4).map(request=><Link key={request.id} to={`/admin/requests?id=${request.id}`}><span className="dhl-admin-list-icon"><Package size={17}/></span><span><strong>{request.sender_name}</strong><small>{request.origin} → {request.destination}</small></span><span className={`dhl-admin-status ${request.status==='pending'?'transit':'pending'}`}>{formatStatus(request.status)}</span></Link>)}</div>:<div className="dhl-admin-empty"><Clock3 size={22}/><strong>No requests yet</strong><span>Customer submissions will appear here.</span></div>}</section><section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Support conversations</h2><Link to="/admin/chat">Open inbox <ArrowUpRight size={14}/></Link></div>{threads.length?<div className="dhl-admin-compact-list">{threads.slice(0,4).map(thread=><Link key={thread.id} to={`/admin/chat/${thread.id}`}><span className="dhl-admin-list-icon red"><Headphones size={17}/></span><span><strong>{reference(thread.trackingId)}</strong><small>{thread.lastMessagePreview || 'No messages yet'}</small></span>{thread.unreadForAdmin>0&&<b className="dhl-admin-unread">{thread.unreadForAdmin}</b>}</Link>)}</div>:<div className="dhl-admin-empty"><Headphones size={22}/><strong>Inbox is clear</strong><span>New support conversations will appear here.</span></div>}</section><section className="dhl-admin-card"><div className="dhl-admin-card-head"><h2>Recent notifications</h2><Link to="/admin/notifications">View all <ArrowUpRight size={14}/></Link></div>{!notificationsAvailable?<div className="dhl-admin-empty"><Bell size={22}/><strong>Delivery records unavailable</strong><span>Notification history needs admin read access to delivery records.</span></div>:notifications.length?<div className="dhl-admin-compact-list">{notifications.map(item=><Link key={item.id} to="/admin/notifications"><span className="dhl-admin-list-icon"><Bell size={17}/></span><span><strong>{formatStatus(item.notification_type)}</strong><small>{item.recipient_type} · {reference(item.tracking_id)} · {shortDate(item.sent_at||item.created_at)}</small></span><span className={`dhl-admin-status ${item.delivery_status==='sent'?'delivered':item.delivery_status==='failed'?'alert':'pending'}`}>{formatStatus(item.delivery_status)}</span></Link>)}</div>:<div className="dhl-admin-empty"><Bell size={22}/><strong>No notifications yet</strong><span>Customer emails appear here as shipments are published and updated.</span></div>}</section></div>
  </div>;
}
