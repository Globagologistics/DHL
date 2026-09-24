import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserRound, X } from 'lucide-react';
import { AdminContext, type Shipment } from '../contexts/AdminContext';

type Customer = {key:string;name:string;email:string;phone:string;shipments:Shipment[];lastActivity:string;role:'Sender'|'Recipient'};
export default function AdminCustomers() {
  const {shipments}=useContext(AdminContext);
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<Customer|null>(null);
  const customers=useMemo(()=>{
    const map=new Map<string,Customer>();
    shipments.forEach(shipment=>{([['Sender',shipment.senderName,shipment.senderEmail||'',shipment.senderPhone],['Recipient',shipment.receiverName,shipment.receiverEmail||'',shipment.receiverPhone]] as const).forEach(([role,name,email,phone])=>{const key=(email||phone||name).trim().toLowerCase();if(!key)return;const existing=map.get(key);if(existing){existing.shipments.push(shipment);if((shipment.updatedAt||'')>existing.lastActivity)existing.lastActivity=shipment.updatedAt||'';}else map.set(key,{key,name,email,phone,shipments:[shipment],lastActivity:shipment.updatedAt||shipment.createdAt||'',role});});});
    return [...map.values()].sort((a,b)=>b.lastActivity.localeCompare(a.lastActivity));
  },[shipments]);
  const visible=customers.filter(item=>[item.name,item.email,item.phone].join(' ').toLowerCase().includes(query.toLowerCase()));
  return <div><div className="dhl-admin-page-head"><div><span className="dhl-admin-eyebrow">RELATIONSHIPS</span><h1>Customers</h1><p>Contacts linked to the shipments you manage.</p></div></div><section className="dhl-admin-card"><div className="dhl-admin-list-controls"><div className="dhl-admin-list-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, email or phone" aria-label="Search customers"/></div><span className="dhl-admin-list-count">{visible.length} contacts</span></div>{visible.length?<div className="dhl-admin-table-wrap"><table className="dhl-admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Shipments</th><th>Role</th><th>Last activity</th><th>Action</th></tr></thead><tbody>{visible.map(item=><tr key={item.key}><td><strong>{item.name}</strong></td><td>{item.email||'—'}</td><td>{item.phone||'—'}</td><td>{item.shipments.length}</td><td>{item.role}</td><td>{item.lastActivity?new Date(item.lastActivity).toLocaleDateString():'—'}</td><td><button type="button" className="dhl-admin-text-action" onClick={()=>setSelected(item)}>View details</button></td></tr>)}</tbody></table></div>:<div className="dhl-admin-empty"><UserRound size={24}/><strong>No contacts found</strong><span>Contacts are derived from existing shipments.</span></div>}</section>{selected&&<div className="dhl-admin-modal-layer" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="dhl-admin-customer-dialog" role="dialog" aria-modal="true" aria-label="Customer details"><div><h2>{selected.name}</h2><button type="button" aria-label="Close" onClick={()=>setSelected(null)}><X size={20}/></button></div><p>{selected.role} · {selected.email||'No email'} · {selected.phone||'No phone'}</p><h3>Shipment history</h3>{selected.shipments.map(shipment=><Link key={shipment.id} to={`/admin/shipments/${shipment.id}`}><span>{shipment.id.slice(0,13).toUpperCase()}</span><small>{shipment.packageName||'Shipment'} · {shipment.status||'Processing'}</small></Link>)}</section></div>}</div>;
}
