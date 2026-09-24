import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, WifiOff } from 'lucide-react';
import { PageHeading } from '../components/customer/CustomerShell';

type State = 'loading' | 'connection' | 'server';
export default function SendShipment() {
  const [state, setState] = useState<State>('loading');
  const [retried, setRetried] = useState(false);
  useEffect(() => {
    if (state !== 'loading') return;
    const timer = window.setTimeout(() => setState(retried ? 'server' : 'connection'), 10000);
    return () => window.clearTimeout(timer);
  }, [state, retried]);
  return <div className="dhl-container"><PageHeading title="Send Shipment" backTo="/home"/><section className="dhl-send-state"><div className={`dhl-send-visual ${state}`}>{state === 'loading' ? <Package size={48}/> : <WifiOff size={48}/>}</div><span className="dhl-eyebrow">{state === 'loading' ? 'Shipment services' : state === 'connection' ? 'Connection issue' : 'Service update'}</span><h1>{state === 'loading' ? 'Preparing shipment services…' : state === 'connection' ? 'We’re having trouble connecting.' : 'Shipment services are temporarily unavailable.'}</h1><p>{state === 'loading' ? 'Please wait while we connect you to shipment services.' : state === 'connection' ? 'Shipment services are temporarily unavailable.' : 'Please try again in approximately 5 minutes.'}</p>{state === 'loading' ? <div className="dhl-loading-line"><span/></div> : <div className="dhl-send-actions"><button className="dhl-primary-button" onClick={() => { setRetried(true); setState('loading'); }}>Try Again</button><Link className="dhl-secondary-button" to="/home">Back to Home</Link></div>}</section></div>;
}
